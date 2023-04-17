import React from 'react';
import { renderToString } from 'react-dom/server';
import html from 'dedent';
import { VocabProvider } from '@vocab/react';

import type { RenderContext } from './types';
import type { Render } from 'sku';
import App from './App';

export default {
  renderApp: ({ SkuProvider, language }) =>
    renderToString(
      <SkuProvider>
        <VocabProvider language={language}>
          <App />
        </VocabProvider>
      </SkuProvider>,
    ),
  provideClientContext: ({ language }): RenderContext => ({ language }),
  renderDocument: ({ app, bodyTags, headTags }) => html/* html */ `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>My Awesome Project</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        ${headTags}
      </head>
      <body>
        <div id="app">${app}</div>
        ${bodyTags}
      </body>
    </html>
  `,
} as Render;
