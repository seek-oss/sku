import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  buildType: 'ssr',
  publicPath: '/static/ssr-sites/',
  port: 8216,
  target: 'dist',
  sites: ['au', 'nz'],
} satisfies SkuConfig;
