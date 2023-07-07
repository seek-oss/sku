import type { SkuConfig } from 'sku';
// @ts-ignore no types
import { makeStableHashes } from '@sku-private/test-utils';

export default {
  clientEntry: 'src/ssr-client.tsx',
  serverEntry: 'src/server.tsx',
  setupTests: 'src/setupTests.js',
  languages: ['en', 'fr'],
  initialPath: '/en',
  target: 'dist-ssr',
  port: 8313,
  serverPort: 8314,
  dangerouslySetWebpackConfig: (config) => makeStableHashes(config),
} satisfies SkuConfig;
