import { makeStableHashes } from '@sku-private/test-utils';
import type { SkuConfig } from 'sku';

export default {
  clientEntry: 'src/client-ssr.tsx',
  serverEntry: 'src/server.tsx',
  port: 8204,
  serverPort: 8010,
  // Required for test to serve client assets correctly
  publicPath: 'http://localhost:4003/',
  dangerouslySetWebpackConfig: (config) => makeStableHashes(config),
} satisfies SkuConfig;
