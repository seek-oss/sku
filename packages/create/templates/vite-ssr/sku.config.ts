import type { SkuConfig } from 'sku';

const skuConfig = {
  bundler: 'vite',
  buildType: 'ssr',
  publicPath: '/',
  expressTrustProxy: true,
  testRunner: 'vitest',
  pathAliases: {
    '#src/*': './src/*',
  },
} satisfies SkuConfig;

export default skuConfig;
