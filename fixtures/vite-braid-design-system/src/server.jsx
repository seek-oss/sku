import { StrictMode } from 'react';
import { renderToString, renderToPipeableStream } from 'react-dom/server';
import { preloadAll } from 'sku/@vite-preload';
import { LoadableProvider } from 'sku/@vite-preload/provider';

import App from './App';

const render = async ({ site, options, loadableCollector }) => {
  await preloadAll();

  return renderToPipeableStream(
    <StrictMode>
      <LoadableProvider value={loadableCollector}>
        <App themeName={site.name} />
      </LoadableProvider>
    </StrictMode>,
    options,
  );
};

export default {
  render,
  renderApp: ({ site }) => {
    return renderToString(
      <StrictMode>
        <App themeName={site.name} />
      </StrictMode>,
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
