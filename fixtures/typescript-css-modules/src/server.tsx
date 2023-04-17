import * as React from 'react';
import { renderToString } from 'react-dom/server';

import App from './App';

interface SkuProps {
  SkuProvider: React.FunctionComponent;
  getHeadTags: () => string;
  getBodyTags: () => string;
}
export default () => ({
  renderCallback: (
    { SkuProvider, getBodyTags, getHeadTags }: SkuProps,
    _: any,
    res: any,
  ): void => {
    const app = renderToString(
      <SkuProvider>
        <App />
      </SkuProvider>,
    );

    res.send(/* html */ `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>My Awesome Project</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          ${getHeadTags()}
        </head>
        <body>
          <div id="app">${app}</div>
          ${getBodyTags()}
        </body>
      </html>
    `);
  },
});
