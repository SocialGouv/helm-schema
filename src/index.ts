import { Parser } from "yaml";
import { parse as commentParser } from "comment-parser";
import {
  Token,
  CollectionItem,
  BlockSequence,
  BlockMap,
  Document,
  FlowCollection,
  BlockScalar,
  FlowScalar,
  SourceToken,
} from "yaml/dist/parse/cst";
import { JSONSchema4, JSONSchema4TypeName } from "json-schema";

interface SectionComment {
  description: string;
}

interface ParsedComment {
  key: string;
  description: string;
  type: JSONSchema4TypeName;
  required: boolean;
  offset: number;
}

interface YamlScalar {
  description?: string;
  type?: JSONSchema4TypeName;
  required?: boolean;
  offset: number;
  key: string;
  value: any;
  children?: YamlScalar[];
  parent?: Token;
  comment?: ParsedComment;
}

function hasSource(
  object: any
): object is SourceToken | FlowScalar | BlockScalar {
  return "source" in object;
}

function hasSep(
  object: any
): object is
  | CollectionItem
  | BlockSequence["items"][0]
  | BlockMap["items"][0]
  | BlockMap["items"][1] {
  return "sep" in object;
}

const hasKey = hasSep;

function hasValue(
  object: any
): object is
  | CollectionItem
  | Document
  | BlockSequence["items"][0]
  | BlockMap["items"][0]
  | BlockMap["items"][1] {
  return "value" in object;
}

function hasItems(
  object: any
): object is BlockMap | BlockSequence | FlowCollection {
  return "items" in object;
}

function isComment(object: any): object is Comment {
  return "type" in object && object.type === "comment";
}

function hasChildren(object: any) {
  return "children" in object;
}

function hasOffset(object: any): object is ParsedComment {
  return "offset" in object;
}

const cleanDescriptionText = (text: string) =>
  text
    .replace(/# @section (.*)/, "$1")
    .replace(/\s*#+\s*(?:-)*\s*(.*)/, "$1")
    .replace(/\s*-+\s*(.*)/, "$1")
    .trim();

/**
 * Parse node comment with JSDoc like annotations
 */
const parseCommentLine = (
  node: Token
): SectionComment | ParsedComment | undefined => {
  if (hasSource(node)) {
    if (node.source.match(/# @section/)) {
      return {
        description: cleanDescriptionText(node.source),
        offset: node.offset,
      };
    }
    const parsedLine = commentParser(
      node.source.replace(/^\s*#+\s*(?:-)*\s*(.*)/, "/** $1 */") // replaces starting with # or # --
    );
    if (parsedLine[0].tags.length) {
      const tag = parsedLine[0].tags[0];
      const type = tag.type && tag.type.replace(/^\{(.*)\}$/g, "$1");
      const name = parsedLine[0]?.source[0]?.tokens?.name || tag.name; // check if optiona [name]
      return {
        key: name.replace(/[\[\]]/g, ""),
        description: cleanDescriptionText(tag.description),
        type: type.replace(/(.*)\?$/, "$1") as JSONSchema4TypeName, // remove question mark
        required: name ? name.indexOf("[") === -1 : true,
        offset: node.offset,
      };
    }
    return {
      description: cleanDescriptionText(node.source),
      required: true,
      offset: node.offset,
    };
  }
};

/**
 * Extract and parse all comments from a CST node
 */
const getCommentTokens = (root: Token[], child?: Token | CollectionItem) => {
  const comments = [];
  const node = child || root;
  if (isComment(node)) {
    comments.push(node);
  }
  if (hasSep(node)) {
    node.sep
      .filter((n) => n.type === "comment")
      .forEach((n) => {
        comments.push(...getCommentTokens(root, n));
      });
  }
  if (hasValue(node) && hasItems(node.value)) {
    if (node.value && node.value.items && node.value.items.length) {
      node.value.items.forEach((n) => {
        comments.push(...getCommentTokens(root, n));
      });
    }
  }
  return comments;
};

const getValues = (
  root: Token[],
  child?: Token | CollectionItem
): YamlScalar[] => {
  const values = [];
  const node = child || root;
  if (hasKey(node) && node.key?.type === "scalar") {
    const scalar: YamlScalar = {
      type: undefined,
      required: undefined,
      offset: node.key.offset,
      key: node.key.source,
      // @ts-ignore
      value: node.value?.source,
      children: [],
      parent: undefined,
    };

    if (hasValue(node) && hasItems(node.value) && node.value.items.length) {
      scalar.children = node.value.items.flatMap((n) => {
        //@ts-ignore
        n.parent = node;
        return getValues(root, n);
      });
      scalar.type = "object";
    }
    values.push(scalar);
  }

  if (hasValue(node) && hasItems(node.value) && node.value.items.length) {
    node.value.items.forEach((item) => {
      // @ts-ignore
      if (!item.parent) {
        // @ts-ignore
        item.parent = node;
        values.push(...getValues(root, item));
      }
    });
  }
  return values;
};

const getNodesOffsets = (values: YamlScalar[]) => {
  const offsets: number[] = [];
  values.forEach((value) => {
    offsets.push(value.offset);
    if (hasChildren(value)) {
      offsets.push(...getNodesOffsets(value.children));
    }
  });
  return offsets;
};

const getSortedComments = (tokens: Token[]) =>
  tokens
    .flatMap((token) => getCommentTokens(tokens, token))
    //.map((node) => hasSource(node))
    .filter((node) => hasSource(node) && hasOffset(node))
    //@ts-ignore
    .map((node) => parseCommentLine(node))
    //@ts-ignore
    .sort((a, b) => a.offset - b.offset);

const getComment = (
  comments: ParsedComment[],
  offsets: number[],
  offset: number
): ParsedComment => {
  const reversedComments = [...comments].reverse();
  const closestComment = reversedComments.find((c) => c.offset < offset);
  const anotherItemBetween =
    closestComment &&
    offsets.find(
      (offset2) => offset2 > closestComment.offset && offset2 < offset
    );
  if (!closestComment || anotherItemBetween) {
    return;
  }
  //return closestComment;
  return {
    key: closestComment.key,
    description: closestComment.description,
    type: closestComment.type,
    required: closestComment.required,
    offset: undefined,
  };
};

const addComments = (
  values: YamlScalar[],
  comments: ParsedComment[],
  offsets: number[]
): void => {
  values.forEach((value) => {
    if (value.offset) {
      const comment = getComment(comments, offsets, value.offset);
      if (comment) {
        value.comment = comment;
      }
    }
    if (value.children) {
      addComments(value.children, comments, offsets);
    }
  });
};

const cleanUp = (values: YamlScalar[]) => {
  values.forEach((value) => {
    value.offset = undefined;
    if (value.children.length === 0) {
      value.children = undefined;
    } else {
      cleanUp(value.children);
    }
  });
};

const cleanUndefined = (object: YamlScalar[]): YamlScalar[] =>
  JSON.parse(JSON.stringify(object));

export const extractValues = (yaml: string) => {
  const parsed = new Parser().parse(yaml);

  const tokens: Token[] = Array.from(parsed);

  const comments = getSortedComments(tokens);

  const values = tokens.flatMap((token) => getValues(tokens, token));

  const offsets = getNodesOffsets(values);

  //@ts-ignore
  addComments(values, comments, offsets);
  cleanUp(values);
  const cleaned = cleanUndefined(values);
  return cleaned;
};

// todo
const detectType = (some: any) => "string" as JSONSchema4TypeName;

const nodeToJsonSchema = (node: YamlScalar, rootProps = {}): JSONSchema4 => {
  const schema: JSONSchema4 = {
    type: node.comment?.type || detectType(node.value),
    ...rootProps,
  };
  if (node.comment?.description) {
    schema.description = node.comment?.description;
  }
  if (node.value) {
    schema.default = node.value;
  }

  if (node.children?.length) {
    schema.type = "object";
    schema.required = node.children
      .filter((c) => c.comment?.required)
      .map((c) => c.key);
    schema.properties = node.children.reduce(
      (a, c) => ({
        ...a,
        [c.key]: nodeToJsonSchema(c),
      }),
      {}
    );
  }
  return schema;
};

export const toJsonSchema = (yaml: string, rootProps = {}): JSONSchema4 => {
  const values = extractValues(yaml);
  const fullValues: YamlScalar = {
    key: "root",
    value: null,
    offset: 0,
    children: values,
  };
  const schema = nodeToJsonSchema(fullValues, {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    ...rootProps,
  });
  return schema;
};
