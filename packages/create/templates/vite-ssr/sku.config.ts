import type { SkuConfig } from 'sku';

const skuConfig = {
  bundler: 'vite',
  buildType: 'ssr',
  publicPath: '/', // relative only — absolute / CDN URLs are rejected for Vite SSR
  testRunner: 'vitest',
  pathAliases: {
    '#src/*': './src/*',
  },
} satisfies SkuConfig;

export default skuConfig;
