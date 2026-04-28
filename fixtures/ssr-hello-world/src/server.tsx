import { renderToString } from 'react-dom/server';
// import type { Server } from 'sku';

import App from './App';

export default () => ({
  renderApp: ({ SkuProvider }) =>
    renderToString(
      <SkuProvider>
        <App />
      </SkuProvider>,
    ),

  renderDocument: ({ getBodyTags, getHeadTags }) => /* html */ `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>hello-world</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        ${getHeadTags()}
      </head>
      <body>
        <div id="app"><!--ssr-outlet--></div>
        ${getBodyTags()}
        <script src="https://code.jquery.com/jquery-3.5.0.slim.min.js"></script>
        <script>console.log('Hi');</script>
      </body>
    </html>
  `,

  onStart: async () => {
    // if (process.env.NODE_ENV === 'production') {
    console.log('Server ran the onStart callback');
    // }
  },
});
