import React from 'react';
import { renderToString } from 'react-dom/server';
import dedent from 'dedent';

import HomePage from './handlers/Home';
import DetailsPage from './handlers/Details';

const pageMap = {
  home: HomePage,
  details: DetailsPage
};

export default {
  renderApp: ({ SkuProvider, routeName, site }) => {
    const App = pageMap[routeName];
    return renderToString(
      <SkuProvider>
        <App site={site} />
      </SkuProvider>
    );
  },

  renderDocument: ({ app, bodyTags, headTags, site, environment }) => {
    return dedent`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>hello-world</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <script>
            window.APP_CONFIG = ${JSON.stringify({ site, environment })};
          </script>
          ${headTags}
        </head>
        <body>
          <div id="app">${app}</div>
          ${bodyTags}
        </body>
      </html>
    `;
  }
};
