import html from 'dedent';
import { StrictMode } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { preloadAll, ChunkCollectorContext } from 'sku/vite-preload';

import App from './App';

export default {
  render: async ({ url, site, options, collector }) => {
    await preloadAll();

    // TODO: Do a react helmet test here.

    const pipeableStream = renderToPipeableStream(
      <StrictMode>
        <ChunkCollectorContext collector={collector}>
          <StaticRouter location={url} context={{}}>
            <App site={site} />
          </StaticRouter>
        </ChunkCollectorContext>
      </StrictMode>,
      options,
    );

    const headTags = html/* html */ `
      <title>${site}</title>
      <script src="https://code.jquery.com/jquery-3.5.0.slim.min.js"></script>
      <script>
        console.log('Hi');
      </script>
      <style type="text/css">
        body {
          background: pink;
        }
      </style>
    `;

    const bodyTags = html/* html */ `
      <script>
        console.log('Hello, world!');
      </script>
    `;

    const htmlAttrs = {
      lang: 'en',
    };

    const bodyAttrs = {
      class: 'body-class',
    };

    return {
      ...pipeableStream,
      headTags,
      bodyTags,
      htmlAttrs,
      bodyAttrs,
    };
  },

  provideClientContext: ({ site }) => ({
    site,
  }),
};
