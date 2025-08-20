import { renderToString } from 'react-dom/server';
import type { Render } from 'sku';

import { App } from './App/App';
import type { ClientContext } from './types';

interface RenderContext {
  appHtml: string;
}

const skuRender: Render<RenderContext> = {
  renderApp: ({ SkuProvider, environment }) => {
    const appHtml = renderToString(
      <SkuProvider>
        <App environment={environment as ClientContext['environment']} />
      </SkuProvider>,
    );

    return {
      appHtml,
    };
  },

  provideClientContext: ({ environment }) => ({
    environment,
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
