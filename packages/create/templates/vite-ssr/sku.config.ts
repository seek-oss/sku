import type { SkuConfig } from 'sku';

const skuConfig = {
  bundler: 'vite',
  buildType: 'ssr',
  publicPath: '/',
  // Vite SSR requires ≥1 configured site name; single-site apps omit `getSite`.
  sites: ['default'],
  testRunner: 'vitest',
  pathAliases: {
    '#src/*': './src/*',
  },
} satisfies SkuConfig;

export default skuConfig;
