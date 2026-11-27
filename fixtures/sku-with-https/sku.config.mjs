import { makeStableViteHashes } from '@sku-private/test-utils';

export default {
  port: 9843,
  httpsDevServer: true,
  clientEntry: './src/client.jsx',
  renderEntry: './src/render.jsx',
  serverEntry: './src/server.jsx',
  devServerMiddleware: './dev-middleware.vite.js',
  cspEnabled: true,
  cspExtraScriptSrcHosts: ['https://some-cdn.com'],
  dangerouslySetViteConfig: makeStableViteHashes,
};
