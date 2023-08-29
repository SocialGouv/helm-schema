import { expect, test } from "@jest/globals";

import { extractValues, toJsonSchema } from "./index";

const tests = [
  {
    title: "YAML without comment",
    yaml: `
name: Jul
age: 42

location:
  country: FR
  `,
  },
  {
    title: "YAML with comments",
    yaml: `
# @param {string} name Your name
name: Jul
# @param {number} age Your age
age: 42

location:
  # @param {string} [country] Your country
  country: FR
  `,
  },
  {
    title: "YAML with nestedcomments",
    yaml: `
family:
  # @param {object} mother The mother
  mother:
    # @param {string} name The mother's name
    name:
    # @param {object} [mother] The mother's mother
    mother:
      # @param {string} [name] The mother mother's name
      name:
`,
  },
  {
    title: "YAML with sections",
    yaml: `
# @section family blablab
family:
  # @param {object} [mother] The mother
  mother:
  `,
  },
  {
    title: "single-line",
    yaml: `
# @param {number} number The magic number
number: 42
  `,
  },
  {
    title: "YAML with multiline comment",
    yaml: `
# family blablab
# more info about that crazy family
family:
  # the mother is important in your life
  # @param {object} [mother] The mother
  mother:
  `,
  },
];

tests.forEach((t) => {
  test(`extractValues: ${t.title}`, () => {
    expect(extractValues(t.yaml)).toMatchSnapshot();
  });
});

tests.forEach((t) => {
  test(`toJsonSchema: ${t.title}`, () => {
    expect(toJsonSchema(t.yaml)).toMatchSnapshot();
  });
});

test("toJsonSchema: add root properties", () => {
  expect(
    toJsonSchema(
      `
# @param {string} [some] Some optional string
some: thing`,
      {
        $id: "some-id",
        title: "schema title",
      }
    )
  ).toMatchSnapshot();
});
