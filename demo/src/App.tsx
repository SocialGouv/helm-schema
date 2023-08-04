import { useState } from "react";
import GitHubForkRibbon from "react-github-fork-ribbon";
import CodeEditor from "@uiw/react-textarea-code-editor";

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

# @param {number} age Your street number
age: 42
`.trim();

function App() {
  const [schema, setSchema] = useState(
    JSON.stringify(toJsonSchema(yaml), null, 2)
  );

  const onYamlChange: React.ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    const content = e.target.value;
    setSchema(JSON.stringify(toJsonSchema(content), null, 2));
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
        <div
          style={{
            flex: "1 0 auto",
            textAlign: "left",
            width: "50%",
            margin: 5,
          }}
        >
          <div style={{ textAlign: "center" }}>values.yaml</div>
          <CodeEditor
            data-color-mode="light"
            language="yaml"
            value={yaml}
            onChange={onYamlChange}
            style={{ height: 800 }}
          />
        </div>
        <div
          style={{
            flex: "1 0 auto",
            textAlign: "left",
            width: "50%",
            margin: 5,
          }}
        >
          <div style={{ textAlign: "center" }}>values.schema.json</div>
          <CodeEditor
            data-color-mode="light"
            language="json"
            value={schema}
            style={{ height: 800 }}
          />
        </div>
      </div>
    </>
  );
}

export default App;
