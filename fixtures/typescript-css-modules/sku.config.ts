import type { SkuConfig } from 'sku';
import { makeStableHashes } from '@sku-private/test-utils';

export default {
  srcPaths: ['src', 'sku-ssr.config.ts'],
  clientEntry: 'src/client.tsx',
  renderEntry: 'src/render.tsx',
  port: 8204,
  publicPath: '/static/typescript',
  setupTests: 'src/setupTests.ts',
  target: 'dist',
  dangerouslySetWebpackConfig: (config) => makeStableHashes(config),
} satisfies SkuConfig;
