import { renderToString } from 'react-dom/server';
import type { Render } from 'sku';
import html from 'dedent';
import App from './App.tsx';

export default {
  renderApp: () => renderToString(<App />),
  renderDocument: ({ app, bodyTags, headTags }) => html /* html */ `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>hello-world</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        ${headTags}
      </head>
      <body>
        <div id="app">${app}</div>
        ${bodyTags}
      </body>
    </html>
  `,
} satisfies Render;
