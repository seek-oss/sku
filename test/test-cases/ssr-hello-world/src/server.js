import React from 'react';
import { renderToString } from 'react-dom/server';

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

export default () => ({
  renderCallback: ({ SkuProvider, getBodyTags, getHeadTags }, req, res) => {
    const app = renderToString(
      <SkuProvider>
        <App />
      </SkuProvider>
    );
    res.send(
      template({ headTags: getHeadTags(), bodyTags: getBodyTags(), app })
    );
  }
});
