import { StrictMode } from 'react';
import { StaticRouter } from 'react-router';
import type { Render } from 'sku';

import { App } from './App.jsx';
import React from 'react';
import html from 'dedent';

export default {
  renderApp: async ({ site, renderToStringAsync, SkuProvider, route }) => {
    return renderToStringAsync(
      <StrictMode>
        <SkuProvider>
          <StaticRouter location={route}>
            <App site={site || ''} />
          </StaticRouter>
        </SkuProvider>
      </StrictMode>,
    );
  },

  provideClientContext: async ({ site }) => ({
    site,
  }),

  renderDocument: ({ app, bodyTags, headTags }) => {
    return html/* html */ `
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
    `;
  },
} satisfies Render;
