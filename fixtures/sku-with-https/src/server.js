import React from 'react';
import { renderToString } from 'react-dom/server';
import { writeFile } from 'fs/promises';

import App from './App';

const initialResponseTemplate = ({ headTags }) => /* html */ `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>hello-world</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${headTags}
`;

const template = ({ headTags, bodyTags, app }) => /* html */ `
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
    _,
    res,
  ) => {
    res.status(200).write(
      initialResponseTemplate({
        headTags: flushHeadTags(),
      }),
    );
    await Promise.resolve();

    const app = renderToString(
      <SkuProvider>
        <App />
      </SkuProvider>,
    );
    res.write(
      template({
        headTags: flushHeadTags(),
        bodyTags: getBodyTags(),
        app,
      }),
    );
    res.end();
  },
  onStart: async () => {
    if (process.env.NODE_ENV === 'production') {
      await writeFile('./started.txt', "Server started, here's your callback");
    }
  },
});
