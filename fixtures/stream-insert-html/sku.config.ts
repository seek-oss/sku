import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  buildType: 'ssr',
  publicPath: '/static/stream-insert-html/',
  port: 8210,
  target: 'dist',
  cspEnabled: true,
} satisfies SkuConfig;
