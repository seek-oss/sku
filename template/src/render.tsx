import React from 'react';
import ReactDOM from 'react-dom/server';
import { Render } from 'sku';

import { RenderContext } from './types';
import App from './App/App';

const skuRender: Render<RenderContext> = {
  renderApp: ({ SkuProvider, site }) => {
    const appHtml = ReactDOM.renderToString(
      <SkuProvider>
        <App site={site} />
      </SkuProvider>,
    );

    return {
      appHtml,
    };
  },

  provideClientContext: ({ site }) => ({
    site,
  }),

  renderDocument: ({ app, bodyTags, headTags }) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        ${headTags}
      </head>
      <body>
        <div id="app">${app.appHtml}</div>
        ${bodyTags}
      </body>
    </html>
  `,
};

export default skuRender;
