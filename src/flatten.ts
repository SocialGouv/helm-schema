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
  blockMap.items.forEach((item) => {
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
