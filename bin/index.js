#!/usr/bin/env node

const { parseArgs } = require("node:util");
const { toJsonSchema } = require("../build");
const fs = require("fs");

const args = process.argv;
const options = {
  file: {
    type: "string",
    short: "f",
    default: "values.yaml",
  },
};
const { values } = parseArgs({
  args,
  options,
  allowPositionals: true,
});

if (!fs.existsSync(values.file)) {
  throw new Error(
    "values.yaml doesnt exist. add the -f flag to point to your file"
  );
}
const yaml = fs.readFileSync(values.file).toString();

console.log(JSON.stringify(toJsonSchema(yaml), null, 2));
