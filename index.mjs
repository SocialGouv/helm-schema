import { Parser } from "yaml";
import { parse as commentParser } from "comment-parser";

const yaml = `

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
            # @param {string?} name Name of the father
            name:

# @param {numer} hits How many hits ?
age: 9876876
`;

const parsed = new Parser().parse(yaml);

const parseCommentLine = (line) => {
  if (line.match(/# @section/)) {
    return {
      description: line.replace(/# @section (.*)/, "$1"),
    };
  }
  const parsedLine = commentParser(
    line.replace(/^\s*#\s*(?:-)*\s*(.*)/, "/** $1 */") // replaces starting with # or # --
  );
  if (parsedLine[0].tags.length) {
    const tag = parsedLine[0].tags[0];

    const type = tag.type && tag.type.replace(/^\{(.*)\}$/g, "$1");
    return {
      description: tag.description.trim(),
      type: type.replace(/(.*)\?$/, "$1"), // remove question mark
      required: type.indexOf("?") === -1,
    };
  }
  return {
    description: line,
  };
};

const getValues = (root, child = null) => {
  const values = [];
  const node = child || root;
  if (node.key?.type === "scalar") {
    const scalar = {
      description: undefined,
      type: undefined,
      name: undefined,
      value: undefined,
      required: undefined,
    };
    const comment = node.start.find((n) => n.type === "comment");
    if (comment) {
      const parsed = parseCommentLine(comment.source);
      scalar.type = parsed.type;
      scalar.description = parsed.description;
      scalar.required = parsed.required;
    } else {
      // first scalar of a new block : special case. try to find in the upper block
      // check if the last block sep is a comment
      if (!node.start.length && node.parent.sep) {
        const contentNodes = node.parent.sep.filter(
          (n) => !["space", "newline"].includes(n.type)
        );
        const comment =
          contentNodes.length && contentNodes[contentNodes.length - 1];
        if (comment && comment.type === "comment") {
          const parsed = parseCommentLine(comment.source);
          scalar.type = parsed.type;
          scalar.description = parsed.description;
          scalar.required = parsed.required;
        }
      }
      // start of the document
      if (
        !node.start.length &&
        !node.parent.parent &&
        node.key.offset === node.parent.offset
      ) {
        const contentNodes = root.filter(
          (n) => !["newline", "space"].includes(n.type)
        );
        const documentIndex = contentNodes.findIndex(
          (n) => n.type === "document"
        );
        if (documentIndex > 0) {
          const commentNode = contentNodes[documentIndex - 1];
          if (commentNode && commentNode.type === "comment") {
            const parsed = parseCommentLine(commentNode.source);
            scalar.type = parsed.type;
            scalar.description = parsed.description;
            scalar.required = parsed.required;
          }
        }
      }
    }

    scalar.name = node.key.source;
    scalar.value = node.value && node.value.source;

    if (node.value && node.value.items && node.value.items.length) {
      scalar.children = node.value.items.map((n) => {
        n.parent = node;
        return getValues(root, n);
      });
      scalar.type = "object";
    }
    values.push(scalar);
  }

  if (node.value && node.value.items && node.value.items.length) {
    node.value.items.forEach((item) => {
      if (!item.parent) {
        item.parent = node;
        values.push(...getValues(root, item));
      }
    });
  }
  return values;
};

const tokens = [];
for (const token of parsed) {
  tokens.push(token);
}

const values = tokens.flatMap((token) => getValues(tokens, token));

console.log(JSON.stringify(values, null, 2));
