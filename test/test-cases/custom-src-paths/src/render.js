import React from 'react';
import { renderToString } from 'react-dom/server';
import App from '../another-folder/App';

export default ({ publicPath }) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <title>hello-world</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body>
      <div id="app">${renderToString(<App />)}</div>
      <script type="text/javascript" src="${publicPath}main.js"></script>
    </body>
  </html>
`;
