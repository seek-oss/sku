import React from 'react';
import html from 'dedent';
import { StaticRouter } from 'react-router-dom/server';
import {
  dehydrate,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';

import App from './App';

export default {
  renderApp: async ({ SkuProvider, route, site, renderToString }) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { staleTime: 60 * 1000 } },
    });

    const appHtml = await renderToString(
      <SkuProvider>
        <StaticRouter location={route} context={{}}>
          <QueryClientProvider client={queryClient}>
            <App site={site} />
          </QueryClientProvider>
        </StaticRouter>
      </SkuProvider>,
    );

    const dehydratedState = dehydrate(queryClient);

    // Set deterministic future dataUpdatedAt for snapshot consistency
    dehydratedState.queries[0].state.dataUpdatedAt = 4323283200000;

    return {
      appHtml,
      dehydratedState,
    };
  },

  provideClientContext: ({ site, app }) => ({
    dehydratedState: app.dehydratedState,
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
          <div id="app">${app.appHtml}</div>
          ${bodyTags}
        </body>
      </html>
    `;
  },
};
