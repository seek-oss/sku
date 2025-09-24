import { makeStableHashes } from '@sku-private/test-utils';
import type { SkuConfig } from 'sku';

export default {
  clientEntry: 'src/client.tsx',
  renderEntry: 'src/render.tsx',
  publicPath: '/static/polyfills',
  port: 4200,
  dangerouslySetWebpackConfig: (config) => makeStableHashes(config),
  polyfills: [
    './src/polyfills.ts',
    '@sku-private/3rd-party-polyfill',
    'core-js',
    'core-js/stable',
    'core-js/es6',
    'core-js/features/promise',
    'isomorphic-fetch',
  ],
} satisfies SkuConfig;
