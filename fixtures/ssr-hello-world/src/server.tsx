import Express from 'express';
import './styles.css';
import { renderToString } from 'react-dom/server';

import { App } from './App';
// @ts-ignore
import clientAssets from './client?assets=client';
// @ts-ignore
import serverAssets from './server?assets=ssr';

// eslint-disable-next-line new-cap
const app = Express();

app.use('/{*splat}', async (_req, res) => {
  const assets = clientAssets.merge(serverAssets);

  const html = renderToString(
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {assets.css.map((attr: any) => (
          <link key={attr.href} rel="stylesheet" {...attr} />
        ))}
        {assets.js.map((attr: any) => (
          <link key={attr.href} type="modulepreload" {...attr} />
        ))}
        <script type="module" src={assets.entry} />
      </head>
      <body id="app">
        <App />
      </body>
    </html>,
  );

  res.send(html);
});

export default app;

// export default {
//   async fetch(_req: Request) {
//     const assets = clientAssets.merge(serverAssets);
//     return new Response(
//       a,
//       { headers: { 'Content-Type': 'text/html;charset=utf-8' } },
//     );
//   },
// };
