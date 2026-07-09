import html from 'dedent';
import { renderToString } from 'react-dom/server';
import type { Render } from 'sku';
import url from '/nested/icon.png?url';

import App from './App.tsx';

export default {
  renderApp: ({ SkuProvider }) =>
    renderToString(
      <SkuProvider>
        <App url={url} />
      </SkuProvider>,
    ),
  renderDocument: ({ app, bodyTags, headTags }) => html /* html */ `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>public-assets</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        ${headTags}
      </head>
      <body>
        <div id="app">${app}</div>
        ${bodyTags}
      </body>
    </html>
  `,
} satisfies Render;
