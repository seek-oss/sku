import ReactDOM from 'react-dom/server';
import type { Render } from 'sku';

import App from './App/App';
import { ClientContext } from './types';

interface RenderContext {
  appHtml: string;
}

const skuRender: Render<RenderContext> = {
  renderApp: ({ SkuProvider, environment }) => {
    const appHtml = ReactDOM.renderToString(
      <SkuProvider>
        <App environment={environment} />
      </SkuProvider>,
    );

    return {
      appHtml,
    };
  },

  provideClientContext: ({ environment }): ClientContext => ({
    environment
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
