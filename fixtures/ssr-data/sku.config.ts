import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  buildType: 'ssr',
  publicPath: '/static/ssr-data/',
  port: 8214,
  target: 'dist',
  devServerMiddleware: './dev-middleware.js',
} satisfies SkuConfig;
