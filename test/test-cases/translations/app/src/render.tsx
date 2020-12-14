import React from 'react';
import { renderToString } from 'react-dom/server';
import dedent from 'dedent';
import { TranslationsProvider } from '@vocab/react';

import type { RenderContext } from './types';
import App from './App';

export default {
  renderApp: ({ SkuProvider, language }) =>
    renderToString(
      <SkuProvider>
        <TranslationsProvider language={language}>
          <App />
        </TranslationsProvider>
      </SkuProvider>,
    ),
  provideClientContext: ({ language }): RenderContext => ({ language }),
  renderDocument: ({ app, bodyTags, headTags }) => dedent`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>My Awesome Project</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        ${headTags}
      </head>
      <body>
        <div id="app">${app}</div>
        ${bodyTags}
      </body>
    </html>
  `,
};
