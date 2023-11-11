# @socialgouv/helm-schema ![npm (scoped)](https://img.shields.io/npm/v/%40socialgouv/helm-schema)

[JSON Schema](https://json-schema.org) generator for your [HELM charts](https://helm.sh).

Demo : https://socialgouv.github.io/helm-schema

## Usage

Example `values.yaml`, following [JSDoc standards](https://devhints.io/jsdoc)

```yaml
# @param {object} smtp Your SMTP setup
smtp:
  # @param {string} host SMTP hostname
  host:
  # @param {number} [port] SMTP port
  port: 587

# Setup your securityContext to reduce security risks, see https://kubernetes.io/docs/tasks/configure-pod-container/security-context/
# @param {https://raw.githubusercontent.com/yannh/kubernetes-json-schema/master/v1.24.0/_definitions.json#/definitions/io.k8s.api.core.v1.PodSecurityContext} [securityContext]
securityContext:
```

To generate a JSON schema from your `values.yaml` :

```sh
npx @socialgouv/helm-schema -f values.yaml
```

Or via TS :

```js
import { toJsonSchema } from "@socialgouv/helm-schema";

import yaml from "./values.yaml";

const schema = toJsonSchema(yaml);
```

You get such JSON schema in result :

```json
{
  "type": "object",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "required": ["smtp"],
  "properties": {
    "smtp": {
      "type": "object",
      "title": "Your SMTP setup",
      "required": ["host"],
      "properties": {
        "host": {
          "type": "string",
          "title": "SMTP hostname"
        },
        "port": {
          "type": "number",
          "title": "SMTP port",
          "default": "587"
        }
      }
    },
    "securityContext": {
      "$ref": "https://raw.githubusercontent.com/yannh/kubernetes-json-schema/master/v1.24.0/_definitions.json#/definitions/io.k8s.api.core.v1.PodSecurityContext",
      "description": "Setup your securityContext to reduce security risks, see https://kubernetes.io/docs/tasks/configure-pod-container/security-context/"
    }
  }
}
```

This schema can then be used with your favorite editor for HELM values validation.

⚠️ Be sure to add an `$id` to the schema if its meant to be referenced from other schemas

## Dev

update snapshots : `yarn snapshots`

## Todo

- ~~multiline comments~~
- sections
- infer types from default values
- ~~handle arrays~~
