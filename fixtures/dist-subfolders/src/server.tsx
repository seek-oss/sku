import html from 'dedent';
import { renderToString } from 'react-dom/server';
import type { Server } from 'sku';

import { App } from './App.tsx';

export default (): Server => ({
  renderCallback: ({ SkuProvider, getHeadTags, getBodyTags }, _req, res) => {
    const app = renderToString(
      <SkuProvider>
        <App route="/" />
      </SkuProvider>,
    );

    res.send(html /* html */ `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>dist-subfolders</title>
          ${getHeadTags()}
        </head>
        <body>
          <div id="app">${app}</div>
          ${getBodyTags()}
        </body>
      </html>
    `);
  },
});
