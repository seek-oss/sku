import React from 'react';
import ReactDOM from 'react-dom/server';
import Helmet from 'react-helmet';
import App from './App/App';

const appHtml = ReactDOM.renderToString(<App />);
const helmet = Helmet.renderStatic();

const htmlAttributes = helmet.htmlAttributes.toString();
const bodyAttributes = helmet.bodyAttributes.toString();
const metaStrings = [
  helmet.title.toString(),
  helmet.meta.toString(),
  helmet.link.toString()
];
const metaHtml = metaStrings.filter(Boolean).join('\n    ');

export default () => `
  <!DOCTYPE html>
  <html${htmlAttributes ? ` ${htmlAttributes}` : ''}>
    <head>
      ${metaHtml}
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="stylesheet" type="text/css" href="/style.css" />
    </head>
    <body${bodyAttributes ? ` ${bodyAttributes}` : ''}>
      <div id="app">${appHtml}</div>
      <script type="text/javascript" src="/main.js"></script>
    </body>
  </html>
`;
