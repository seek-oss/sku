import type { SkuConfig } from 'sku';

const skuConfig = {
  bundler: 'vite',
  buildType: 'ssr',
  publicPath: '/',
  expressTrustProxy: true,
  testRunner: 'vitest',
  entrySideEffects: ['braid-design-system/reset'],
  pathAliases: {
    '#src/*': './src/*',
  },
} satisfies SkuConfig;

export default skuConfig;
