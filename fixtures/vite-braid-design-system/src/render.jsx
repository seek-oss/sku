import { StrictMode } from 'react';
import { renderToString, renderToPipeableStream } from 'react-dom/server';
import { preloadAll, ChunkCollectorContext } from 'sku/vite-preload';

import App from './App';

export default {
  render: async ({ site, options, collector }) => {
    await preloadAll();

    return renderToPipeableStream(
      <StrictMode>
        <ChunkCollectorContext collector={collector}>
          <App themeName={site} />
        </ChunkCollectorContext>
      </StrictMode>,
      options,
    );
  },
  renderApp: ({ site, SkuProvider }) => {
    return renderToString(
      <SkuProvider>
        <App themeName={site} />
      </SkuProvider>,
    );
  },

  provideClientContext: ({ site }) => ({
    site,
  }),

  renderDocument: ({ app, headTags, bodyTags, site }) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>My Awesome Project</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        ${headTags}
        <script>
          window.SKU_SITE = '${site}';
        </script>
      </head>
      <body>
        <div id="app">${app}</div>
        ${bodyTags}
      </body>
    </html>
  `,
};
