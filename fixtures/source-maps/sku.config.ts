import { makeStableViteHashes } from '@sku-private/test-utils';
import type { SkuConfig } from 'sku';

export default {
  clientEntry: 'src/client.tsx',
  renderEntry: 'src/render.tsx',
  publicPath: '/static/source-maps',
  port: 8303,
  target: 'dist',
  sourceMapsProd: process.env.SKU_SOURCE_MAPS_PROD === 'true',
  dangerouslySetViteConfig: makeStableViteHashes,
} satisfies SkuConfig;
