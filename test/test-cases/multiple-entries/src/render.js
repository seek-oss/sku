import React from 'react';
import { renderToString } from 'react-dom/server';

import HomePage from './handlers/Home';
import DetailsPage from './handlers/Details';

const pageMap = {
  home: HomePage,
  details: DetailsPage
};

export const renderApp = ({ routeName, site }) => {
  const App = pageMap[routeName];
  return renderToString(<App site={site} />);
};

export const renderHTML = ({ app, bodyTags, headTags, site, environment }) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>hello-world</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script>
          window.SKU_CONFIG = ${JSON.stringify({ site, environment })};
        </script>
        ${headTags}
      </head>
      <body>
        <div id="app">${app}</div>
        ${bodyTags}
      </body>
    </html>
  `;
};
