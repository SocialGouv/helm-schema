import { useState } from "react";
import GitHubForkRibbon from "react-github-fork-ribbon";

import "./App.css";

import { toJsonSchema } from "@socialgouv/helm-schema";

const yaml = `
# @param {string} name Your first name
firstname: Julien

# @param {string} name Your last name
lastname: Boubou

# @param {object} address Your address
address:
  # @param {string} [street] Your street name
  street:
  # @param {number} [number] Your street number
  number:
`.trim();

function App() {
  const [schema, setSchema] = useState(
    JSON.stringify(toJsonSchema(yaml), null, 2)
  );
  const onChange: React.ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    const yaml = e.target.value;
    setSchema(JSON.stringify(toJsonSchema(yaml), null, 2));
  };
  return (
    <>
      <GitHubForkRibbon
        href="https://github.com/socialgouv/helm-schema"
        target="_blank"
        position="right"
      >
        Fork me on GitHub
      </GitHubForkRibbon>
      <h1>helm-schema demo</h1>
      <p>
        Annotate your HELM values.yaml files with{" "}
        <a
          href="https://jsdoc.app/tags-param.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          JSDoc comments
        </a>{" "}
        and extract a values.schema.json
      </p>
      <div style={{ display: "flex", width: "100%" }}>
        <div style={{ flex: "1 0 auto", textAlign: "center", height: "80vh" }}>
          <textarea
            onChange={onChange}
            style={{ width: "100%", height: "100%" }}
            defaultValue={yaml}
          ></textarea>
        </div>
        <div style={{ flex: "1 0 auto", textAlign: "center", height: "80vh" }}>
          <textarea
            style={{ width: "100%", height: "100%" }}
            value={schema}
            readOnly
          ></textarea>
        </div>
      </div>
    </>
  );
}

export default App;
