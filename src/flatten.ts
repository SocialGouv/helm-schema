import { Parser } from "yaml";
import {
  BlockMap,
  SourceToken,
  Document,
  Token,
  BlockSequence,
} from "yaml/dist/parse/cst";

export const flattenBlock = (blockMap: BlockMap | BlockSequence) => {
  const nodes: (SourceToken | Token)[] = [];
  blockMap?.items?.forEach((item) => {
    if (item.key) nodes.push(item.key);
    if (item.start && item.start.length) {
      nodes.push(...item.start);
    }
    if (item.sep && item.sep.length) {
      nodes.push(...item.sep);
    }
    if (item.value) {
      if (item.value.type === "block-map" || item.value.type === "block-seq") {
        nodes.push(...flattenBlock(item.value));
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

export const flattenYaml = (yaml: string) => {
  const parsed = new Parser().parse(yaml);

  const tokens = Array.from(parsed);

  const documentIndex = tokens.findIndex((t) => t.type === "document");

  const document = tokens[documentIndex] as Document;

  const nodes = [
    ...tokens.slice(0, documentIndex),
    ...flattenBlock(document.value as BlockMap),
  ];
  return nodes;
};

// let comments: SourceToken[] = [];
// let lineCount = 0;
// const scalars: any[] = [];
// nodes.forEach((node) => {
//   if (node.type === "comment") {
//     comments.push(node);
//   }
//   if (node.type === "scalar") {
//     scalars.push({
//       ...node,
//       comments,
//     });
//     comments = [];
//   }
// });

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

//#console.log(JSON.stringify(nodes, null, 2));
//console.log(JSON.stringify(scalars, null, 2));

//console.log(comments);
