import html from 'dedent';
import { renderToString } from 'react-dom/server';

import App from './app.jsx';

export default {
  renderApp: ({ SkuProvider }) =>
    renderToString(
      <SkuProvider>
        <App />
      </SkuProvider>,
    ),
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
};
