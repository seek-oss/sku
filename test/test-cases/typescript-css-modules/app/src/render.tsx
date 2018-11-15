import React from 'react';
import { renderToString } from 'react-dom/server';

import App from './App';

export const renderApp = () => renderToString(<App />);

interface RenderHTMLProps {
  app: string;
  headTags: string;
  bodyTags: string;
}
export const renderHTML = ({ app, headTags, bodyTags }: RenderHTMLProps) => `
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
`;
