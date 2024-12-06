// @ts-ignore no types
import { makeStableHashes } from '@sku-private/test-utils';
// @ts-ignore TS1479
import type { SkuConfig } from 'sku';

export default {
  clientEntry: 'src/client.tsx',
  renderEntry: 'src/render.tsx',
  port: 8205,
  publicPath: '/styling',
  target: 'dist',
  dangerouslySetWebpackConfig: (config) => makeStableHashes(config),

  dangerouslySetTSConfig: (config) => ({
    ...config,
    include: ['**/*', '.storybook/*'],
  }),

  eslintIgnore: ['**/storybook-static/'],
} satisfies SkuConfig;
