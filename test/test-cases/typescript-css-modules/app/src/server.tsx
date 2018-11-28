import React from 'react';
import { renderToString } from 'react-dom/server';

import App from './App';

interface SkuProps {
  headTags: string;
  bodyTags: string;
}
export default ({ headTags, bodyTags }: SkuProps) => ({
  renderCallback: (_: any, res: any): void => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>My Awesome Project</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          ${headTags}
        </head>
        <body>
          <div id="app">${renderToString(<App />)}</div>
          ${bodyTags}
        </body>
      </html>
    `);
  }
});
