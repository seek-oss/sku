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

    return {
      appHtml: await renderToString(
        <SkuProvider>
          <StaticRouter location={route} context={{}}>
            <QueryClientProvider client={queryClient}>
              <App site={site} />
            </QueryClientProvider>
          </StaticRouter>
        </SkuProvider>,
      ),
      dehydratedState: dehydrate(queryClient),
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
