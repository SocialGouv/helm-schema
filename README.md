# @socialgouv/helm-schema ![npm (scoped)](https://img.shields.io/npm/v/%40socialgouv/helm-schema)

[JSON Schema](https://json-schema.org) generator for your [HELM charts](https://helm.sh).

Demo : https://socialgouv.github.io/helm-schema

## Usage

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

## Dev

update snapshots :

```sh
yarn test -u
./bin/index.js -f .github/e2e/values1.yaml > .github/e2e/values1.schema.json
```

## Todo

- ~~multiline comments~~
- sections
- handle arrays
