import { makeStableViteHashes } from '@sku-private/test-utils';

export default {
  port: 9845,
  clientEntry: './src/client.jsx',
  renderEntry: './src/render.jsx',
  serverEntry: './src/server.jsx',
  cspEnabled: true,
  cspExtraScriptSrcHosts: ['https://some-cdn.com'],
  dangerouslySetViteConfig: makeStableViteHashes,
};
