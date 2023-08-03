import { expect, jest, test } from "@jest/globals";

import { extract } from "./index";

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
  //   {
  //     title: "YAML with multiline comment",
  //     yaml: `
  // # @section family blablab
  // # more info about that crazy family
  // family:
  //   # @param {object} [mother] The mother
  //   # the mother is important in your life
  //   mother:
  // `,
  //   },
];

tests.forEach((t) => {
  test(t.title, () => {
    expect(extract(t.yaml)).toMatchSnapshot();
  });
});
