import React from 'react';
import { renderToString } from 'react-dom/server';
import fs from 'fs';
import { promisify } from 'util';
const writeFile = promisify(fs.writeFile);

import App from './App';

const template = ({ headTags, bodyTags, app }) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <title>hello-world</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      ${headTags}
    </head>
    <body>
      <div id="app">${app}</div>
      ${bodyTags}
    </body>
  </html>
`;

export default ({ headTags, bodyTags }) => ({
  renderCallback: (req, res) => {
    const app = renderToString(<App />);
    res.send(template({ headTags, bodyTags, app }));
  },
  onStart: async () => {
    await writeFile('./started.txt', "Server started, here's your callback");
  }
});
