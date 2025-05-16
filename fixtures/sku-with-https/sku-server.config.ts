import {
  ListExternalsWebpackPlugin,
  makeStableHashes,
} from '@sku-private/test-utils';
import type { SkuConfig } from 'sku';

export default {
  clientEntry: 'src/serverClient.jsx',
  serverEntry: 'src/server.jsx',
  renderEntry: 'src/render.jsx',
  port: 9843,
  serverPort: 9894,
  httpsDevServer: true,
  devServerMiddleware: './dev-middleware.cjs',
  cspEnabled: true,
  cspExtraScriptSrcHosts: ['https://some-cdn.com'],
  dangerouslySetWebpackConfig: (config) => {
    if (config.name === 'render') {
      config.plugins.push(new ListExternalsWebpackPlugin());
    }

    makeStableHashes(config);

    return config;
  },
} satisfies SkuConfig;
