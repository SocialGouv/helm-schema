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
  {
    title: "YAML with external references",
    yaml: `
# Setup your securityContext to reduce security risks, see https://kubernetes.io/docs/tasks/configure-pod-container/security-context/
# @param {https://raw.githubusercontent.com/yannh/kubernetes-json-schema/master/v1.24.0/_definitions.json#/definitions/io.k8s.api.core.v1.PodSecurityContext} securityContext
securityContext:
  `,
  },
  {
    title: "JSDoc with multiple types",
    yaml: `

# @param {string,null} securityContext
securityContext:
  `,
  },
  {
    title: "JSDoc with string array",
    yaml: `

# @param {string[]} command
command:
  `,
    //  "type": "array"
    //  "items": {
    //     "type": "string"
    //   },
  },
  {
    title: "JSDoc with ref array",
    yaml: `

# @param {https://raw.githubusercontent.com/yannh/kubernetes-json-schema/master/v1.24.0/_definitions.json#/definitions/io.k8s.api.core.v1.EnvFromSource[]} envFrom
envFrom:
  `,
  },
];

//  "type": "array"
//  "items": {
//     "$ref": "https://raw.githubusercontent.com/yannh/kubernetes-json-schema/master/v1.24.0/_definitions.json#/definitions/io.k8s.api.core.v1.EnvFromSource"
//   },

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
