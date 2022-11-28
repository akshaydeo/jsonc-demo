import { useEffect, useRef, useState } from 'react';
import './App.css';
import * as monaco from 'monaco-editor';
const {
  parse,  
} = require('comment-json')

export default function App() {
  const node = useRef(undefined);
  const node2 = useRef(undefined);
  const [bodyToSend, setBodyToSend] = useState({});
  const [documentation, setDocumentation] = useState(undefined);

  const payload = `{    
    // description: either true or false
    "boolean": true,
    // description: acts as a number
    "number" : 1,
    // description: single decimal point
    "double" : 1.2,
    // description: this is string but enum
    // enum: Test, Test2, Value
    "string" : "Test",
    // description: this is an object
    // required: false
    "object" : {}
}`;

  const processPayload = (payload) => {
    try {
      const parsedBody = parse(payload, null, true);
      const parsedWithComments = parse(payload);
      console.log('payload', payload);
      console.log('parsed', parsedBody);
      setBodyToSend(parsedBody);
      const documentation = {};
      // preparing documentation
      Object.keys(parsedBody).forEach((key) => {
        documentation[key] = { required: true };
        console.log(`before-prop:${key}`);
        const comments = parsedWithComments[Symbol.for(`before:${key}`)];
        console.log(comments);
        documentation[key]['type'] = typeof parsedBody[key];
        if (!comments) return;
        comments.forEach((comment) => {
          console.log(comment);
          const split = comment.value.split(":").map(v => v.trim());
          console.log("split==>", split);
          switch (split[0]) {
            case "description":
              documentation[key]['description'] = split[1];
              break;
            case "enum":
              documentation[key]['enum'] = split[1].split(',').map(v => v.trim());
              break;
            case "required":
              documentation[key]['required'] = split[1] === 'true';
              break;
            default:
              break;
          }
        });
      });
      console.log(documentation);
      setDocumentation(documentation);
    } catch (err) {
      console.log('err', err);
    }
  };

  useEffect(() => {
    const model = monaco.editor.createModel(JSON.stringify(bodyToSend, undefined, 2), 'json');
    const editor = monaco.editor.create(node2.current, {});
    editor.setModel(model);
    editor.updateOptions({
      readOnly: true
    });
    return () => {
      editor.dispose();
    };
  }, [bodyToSend]);

  useEffect(() => {
    processPayload(payload);
    const model = monaco.editor.createModel(payload, 'json');
    const editor = monaco.editor.create(node.current, {});
    editor.onDidChangeModelContent((event) => {
      processPayload(editor.getValue());
    });
    editor.setModel(model);
    return () => {
      editor.dispose();
    };
  }, []);

  return <div style={{ display: 'flex', flexDirection: 'row' }}>
    <div style={{ borderRight: '1px solid black' }}>
      <h2>Actual payload</h2>
      <hr />
      <div ref={node} style={{ width: '50vw', height: '100vh' }} />
    </div>
    <div style={{ paddingLeft: 10, width: '50vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <h2>Body to send</h2>
      <hr />
      <div>
        <div ref={node2} style={{ width: '50vw', height: '200px' }} />
      </div>
      <hr />
      <h2>Documentation</h2>
      <hr />
      <table>
        <tr>
          <th>Field</th>
          <th>Type</th>
          <th>Description</th>
          <th>Enum</th>
          <th>IsRequired</th>
        </tr>
        {Object.keys(documentation).map((key) => {
          return <tr>
            <td>{key}</td>
            <td>{documentation[key]['type']}</td>
            <td>{documentation[key]['description']}</td>
            <td>{documentation[key]['enum']}</td>
            <td>{documentation[key]['required'] === true ? "Yes" : "No"}</td>
          </tr>;
        })}
      </table>
    </div>
  </div>
}
