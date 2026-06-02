import { StaticRouter } from 'react-router';
import type { Render } from 'sku';

import App from './App';

export default {
  renderApp: async ({ SkuProvider, route, renderToStringAsync }) =>
    await renderToStringAsync(
      <SkuProvider>
        <StaticRouter location={route}>
          <App />
        </StaticRouter>
      </SkuProvider>,
    ),

  renderDocument: ({ app, bodyTags, headTags }) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>vite-loadable-css-order</title>
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
