// import html from 'dedent';
import { StrictMode } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { preloadAll, ChunkCollectorContext } from 'sku/vite-preload';

import { App } from './App.jsx';

export default {
  render: async ({ options, collector }) => {
    await preloadAll();

    return renderToPipeableStream(
      <StrictMode>
        <ChunkCollectorContext collector={collector}>
          <App />
        </ChunkCollectorContext>
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
