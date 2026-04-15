import html from 'dedent';
import { renderToString } from 'react-dom/server';
import type { Render } from 'sku';

import { App } from './App';

throw new Error('Render entrypoint error');

export default {
  renderApp: ({ SkuProvider, route }) =>
    renderToString(
      <SkuProvider>
        <App route={route} />
      </SkuProvider>,
    ),

  provideClientContext: ({ route }) => ({ route }),

  renderDocument: ({ app, bodyTags, headTags }) => html /* html */ `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>hello-world</title>
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
