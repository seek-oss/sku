import React from 'react';
import { renderToString } from 'react-dom/server';
import fs from 'fs';
import { promisify } from 'util';
const writeFile = promisify(fs.writeFile);

import App from './App';

const initialResponseTemplate = ({ headTags }) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>hello-world</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${headTags}
`;

const template = ({ headTags, bodyTags, app }) => `
      ${headTags}
    </head>
    <body>
      <div id="app">${app}</div>
      ${bodyTags}
    </body>
  </html>
`;

export default () => ({
  renderCallback: async (
    { SkuProvider, getBodyTags, flushHeadTags },
    req,
    res,
  ) => {
    res
      .status(200)
      .write(initialResponseTemplate({ headTags: flushHeadTags() }));
    res.flush();
    await Promise.resolve();

    const app = renderToString(
      <SkuProvider>
        <App />
      </SkuProvider>,
    );
    res.write(
      template({ headTags: flushHeadTags(), bodyTags: getBodyTags(), app }),
    );
    res.end();
  },
  onStart: async () => {
    await writeFile('./started.txt', "Server started, here's your callback");
  },
});
