import { makeStableViteHashes } from '@sku-private/test-utils';
import type { SkuConfig } from 'sku';

export default {
  clientEntry: 'src/client.tsx',
  renderEntry: 'src/render.tsx',
  publicPath: '/static/polyfills',
  port: 4200,
  polyfills: ['./src/polyfills.ts', '@sku-private/3rd-party-polyfill'],
  dangerouslySetViteConfig: makeStableViteHashes,
} satisfies SkuConfig;
