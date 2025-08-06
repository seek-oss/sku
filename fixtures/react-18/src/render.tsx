import html from 'dedent';
import type { Render } from 'sku';

import { App } from './App.tsx';

export default {
  renderApp: ({ SkuProvider, renderToStringAsync }) =>
    renderToStringAsync(
      <SkuProvider>
        <App />
      </SkuProvider>,
    ),
  renderDocument: ({ app, bodyTags, headTags }) => html /* html */ `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>React 18</title>
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
