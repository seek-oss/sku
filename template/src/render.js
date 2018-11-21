import React from 'react';
import ReactDOM from 'react-dom/server';
import Helmet from 'react-helmet';
import App from './App/App';

const renderApp = () => {
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

  return {
    appHtml,
    metaHtml,
    htmlAttributes,
    bodyAttributes
  };
};

const renderDocument = ({ app, bodyTags, headTags }) => `
  <!DOCTYPE html>
  <html${app.htmlAttributes ? ` ${app.htmlAttributes}` : ''}>
    <head>
      ${app.metaHtml}
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      ${headTags}
    </head>
    <body${app.bodyAttributes ? ` ${app.bodyAttributes}` : ''}>
      <div id="app">${app.appHtml}</div>
      ${bodyTags}
    </body>
  </html>
`;

export default {
  renderApp,
  renderDocument
};
