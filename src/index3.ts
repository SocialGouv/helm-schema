import { Block } from "comment-parser";
import { Parser } from "yaml";
import {
  BlockMap,
  CollectionItem,
  SourceToken,
  Document,
  Token,
  BlockSequence,
} from "yaml/dist/parse/cst";

const yaml = `# family stuff
# blabla
family:
  cities:
    - Panama
    - Madrid
  # @param {object} mother The mother
  mother:
    # @param {string} name The mother's name
    name:
    # @param {object} [mother] The mother's mother
    mother:
      # @param {string} [name] The mother mother's name
      name:
`;

const parsed = new Parser().parse(yaml.trim());

const tokens = Array.from(parsed);

console.log(tokens.slice(tokens.length - 2));

console.log("---");

const documentIndex = tokens.findIndex((t) => t.type === "document");

const spaceBeforeDocument =
  tokens
    .slice(documentIndex - 2, documentIndex)
    .filter((t) => t.type === "newline").length > 1;

const comments = {
  headComments: tokens
    .slice(0, documentIndex)
    .filter((t) => t.type === "comment"),
  spaceBeforeDocument,
  documentIndex,
};

const flattenDocument = (blockMap: BlockMap | BlockSequence) => {
  const nodes: (SourceToken | Token)[] = [];
  blockMap.items.forEach((item) => {
    if (item.key) nodes.push(item.key);
    if (item.start.length) {
      nodes.push(...item.start);
    }
    if (item.sep.length) {
      nodes.push(...item.sep);
    }
    if (item.value) {
      if (item.value.type === "block-map" || item.value.type === "block-seq") {
        nodes.push(...flattenDocument(item.value));
      } else {
        if (item.value.type === "scalar" && item.value.end) {
          const { end, ...scalar } = item.value;
          if (scalar) {
            nodes.push(scalar);
          }
          if (end.length) {
            nodes.push(...end);
          }
        } else {
          nodes.push(item.value);
        }
      }
    }
  });
  return nodes;
};

const document = tokens[documentIndex] as Document;
//const blockMap = document.value as BlockMap;

const nodes = [
  ...tokens.slice(0, documentIndex),
  ...flattenDocument(document.value as BlockMap),
];

// blockMap.items.forEach((item) => {
//   nodes.push(item.key);
//   if (item.start) {
//     item.sep.forEach((sep) => {
//       nodes.push(sep);
//     });
//   }
//   if (item.sep) {
//     item.sep.forEach((sep) => {
//       nodes.push(sep);
//     });
//   }
//   nodes.push(item.value);
// });

console.log(JSON.stringify(nodes, null, 2));

//console.log(comments);
