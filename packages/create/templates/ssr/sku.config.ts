import type { SkuConfig } from 'sku';

const skuConfig = {
  buildType: 'ssr',
  publicPath: '/',
  expressTrustProxy: true,
  entrySideEffects: ['braid-design-system/reset'],
  pathAliases: {
    '#src/*': './src/*',
  },
} satisfies SkuConfig;

export default skuConfig;
