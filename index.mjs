import { Parser } from "yaml";
import { parse as commentParser } from "comment-parser";

const yaml1 = `

# @param {string} version App version
version:
name: juju

# @param {number} age Age of the person
age: 42

# @section address
address:
    # @param {string} city Living city
    city: Paname
    # @param {number} age Age
    age: 42
    # @param {string} country Living country
    country: FR
    # -- @param {number} bros How many bros
    bros: 1

identity:
    family:
        father:
            # @param {string} [name] Name of the father
            name:
            # @param {string} [sister] Name of the sister
            sister:
            # @param {string} [brother] Name of the brother
            brother:

# @param {number} hits How many hits ?
age: 9876876
`;

const yaml = `

identity:
    family:
        father:
            # @param {string} [name] Name of the father
            father:
            # @param {string} [sister] Name of the sister
            sister:
            mother:
            # @param {string} [brother] Name of the brother
            brother:
    family2:
        father:
            # @param {string} name Name of the father
            name: dad
        sister
            # @param {string} first first name of the sister
            first:
            # @param {string} [last] last name of the sister
            last:
            mother:

`;

const parsed = new Parser().parse(yaml);

/**
 * Parse comment node with JSDoc like annotations
 * @param {string} line
 * @returns {{description, type, required}}
 */
const parseCommentLine = (node) => {
  if (node.source.match(/# @section/)) {
    return {
      description: node.source.replace(/# @section (.*)/, "$1"),
    };
  }
  const parsedLine = commentParser(
    node.source.replace(/^\s*#\s*(?:-)*\s*(.*)/, "/** $1 */") // replaces starting with # or # --
  );
  if (parsedLine[0].tags.length) {
    const tag = parsedLine[0].tags[0];
    const type = tag.type && tag.type.replace(/^\{(.*)\}$/g, "$1");
    const name = parsedLine[0]?.source[0]?.tokens?.name || tag; // check if optiona [name]
    return {
      param: name.replace(/[\[\]]/g, ""),
      description: tag.description.trim(),
      type: type.replace(/(.*)\?$/, "$1"), // remove question mark
      required: name ? name.indexOf("[") === -1 : true,
      offset: node.offset,
      indent: node.indent,
    };
  }
  return {
    description: node.source,
    required: true,
    offset: node.offset,
    indent: node.indent,
  };
};

/**
 * Extract and parse all comments from a YAML CST tree
 * @param {Token} root
 * @param {Token?} child
 * @returns
 */
const getFlatComments = (root, child = null) => {
  const comments = [];
  const node = child || root;
  if (node.type === "comment") {
    comments.push(node);
  }
  if (node.sep) {
    node.sep
      .filter((n) => n.type === "comment")
      .forEach((n) => {
        comments.push(...getFlatComments(root, n));
      });
  }
  if (node.value && node.value.items && node.value.items.length) {
    node.value.items.forEach((n) => {
      comments.push(...getFlatComments(root, n));
    });
  }
  return comments;
};

/**
 * Extract values from a YAML CST tree
 * @param {Token} root
 * @param {Token?} child
 * @returns
 */
const getValues = (root, child = null) => {
  const values = [];
  const node = child || root;
  if (node.key?.type === "scalar") {
    const scalar = {
      description: undefined,
      type: undefined,
      required: undefined,
      offset: node.key.offset,
      indent: node.key.indent,
      param: node.key.source,
      value: node.value?.source,
    };

    if (node.value?.items?.length) {
      scalar.children = node.value.items.flatMap((n) => {
        n.parent = node;
        return getValues(root, n);
      });
      scalar.type = "object";
    }
    values.push(scalar);
  }

  if (node.value?.items?.length) {
    node.value.items.forEach((item) => {
      if (!item.parent) {
        item.parent = node;
        values.push(...getValues(root, item));
      }
    });
  }
  return values;
};

/**
 * Extract all offset from given values
 * @param {any} values
 * @returns
 */
const getNodesOffsets = (values) => {
  const offsets = [];
  values.forEach((value) => {
    offsets.push(value.offset);
    if (value.children) {
      offsets.push(...getNodesOffsets(value.children));
    }
  });
  return offsets;
};

/** @type {Token[]} */
const tokens = [];
for (const token of parsed) {
  console.log(JSON.stringify(token, null, 2));
  tokens.push(token);
}

const comments = tokens
  .flatMap((token) => getFlatComments(tokens, token))
  .map((node) => parseCommentLine(node))
  .sort((a, b) => a.offset - b.offset);

console.log(JSON.stringify(comments, null, 2));

const values = tokens.flatMap((token) => getValues(tokens, token));

const offsets = getNodesOffsets(values);

const getComment = (offset) => {
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
  return {
    ...closestComment,
    offset: undefined,
    indent: undefined,
  };
};

const addComment = (values) => {
  values.forEach((value) => {
    if (value.offset) {
      const comment = getComment(value.offset);
      if (comment) {
        value.comment = comment;
      }
    }
    if (value.children) {
      addComment(value.children);
    }
    value.offset = undefined;
    value.indent = undefined;
  });
};

addComment(values);

console.log(JSON.stringify(values, null, 2));
