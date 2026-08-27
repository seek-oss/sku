import html from 'dedent';
import { renderToString } from 'react-dom/server';
import type { Render } from 'sku';

import App from './App';

export default {
  renderApp: ({ SkuProvider }) =>
    renderToString(
      <SkuProvider>
        <App />
      </SkuProvider>,
    ),

  renderDocument: ({ app, bodyTags, headTags }) => html /* html */ `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>vite-compile-package-styles</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        ${headTags}
      </head>
      <body>
        <div id="app">${app}</div>
        ${bodyTags}
      </body>
    </html>
  `,
} satisfies Render;
