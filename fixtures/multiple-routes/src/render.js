import React from 'react';
import { renderToString } from 'react-dom/server';
import dedent from 'dedent';
import { StaticRouter } from 'react-router-dom';

import App from './App';

export default {
  renderApp: ({ SkuProvider, route, site }) => {
    return renderToString(
      <SkuProvider>
        <StaticRouter location={route} context={{}}>
          <App site={site} />
        </StaticRouter>
      </SkuProvider>,
    );
  },

  provideClientContext: ({ site }) => ({
    site,
  }),

  renderDocument: ({ app, bodyTags, headTags }) => {
    return dedent`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>hello-world</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <script src="https://code.jquery.com/jquery-3.5.0.slim.min.js"></script>
          <script>console.log('Hi');</script>
          <style type="text/css">body{background:pink}</style>
          ${headTags}
        </head>
        <body>
          <div id="app">${app}</div>
          ${bodyTags}
        </body>
      </html>
    `;
  },
};
