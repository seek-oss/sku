import { SkuContext } from '@/context/createSkuContext.js';
import type { Plugin } from 'vite';
import { createPreRenderedHtml } from '@/services/vite/createPreRenderedHtml.js';

export const skuViteMiddlewarePlugin = (skuContext: SkuContext): Plugin => ({
  name: 'vite-plugin-sku-server-middleware',
  configureServer(server) {
    return () => {
      server.middlewares.use(async (req, res, next) => {
        const host = req.headers['host']; // This includes the hostname and port
        const hostname = host?.split(':')[0];
        const site =
          skuContext.sites.find((site) => site.host === hostname) || '';
        const isHtml = req.url === '/index.html';
        // TODO: get path url from req.url
        if (isHtml) {
          // TODO: Both this and start-ssr need to work with vanilla extract. I feel like this is an upgrade path.
          // The build works but the server does not because vanilla extract doesnt transform outside of a build.

          const render = (
            await server.ssrLoadModule(skuContext.paths.renderEntry)
          ).default;

          const clientEntry = require.resolve('./entries/vite-client.jsx');

          const html = await createPreRenderedHtml({
            url: req.url!,
            render,
            site,
            manifest: {},
            extraBodyTags: `<script type="module" src="${clientEntry}"></script>`,
          });

          const viteHtml = await server.transformIndexHtml(
            req.url || '/',
            html,
          );

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(viteHtml);
        } else {
          next();
        }
      });
    };
  },
});
