// import html from 'dedent';
import { StrictMode } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { preloadAll } from 'sku/@vite-preload';
import { LoadableProvider } from 'sku/@vite-preload/provider';

import { App } from './App.jsx';

export default {
  render: async ({ options, loadableCollector }) => {
    await preloadAll();

    return renderToPipeableStream(
      <StrictMode>
        <LoadableProvider value={loadableCollector}>
          <App />
        </LoadableProvider>
      </StrictMode>,
      options,
    );
  },
};
//
// renderDocument: ({ app, bodyTags, headTags }) => html/* html */ `
//   <!DOCTYPE html>
//   <html>
//     <head>
//       <meta charset="UTF-8" />
//       <title>hello-world</title>
//       <meta name="viewport" content="width=device-width, initial-scale=1" />
//       ${headTags}
//     </head>
//     <body>
//       <div id="app">${app}</div>
//       ${bodyTags}
//     </body>
//   </html>
// `,
// };
