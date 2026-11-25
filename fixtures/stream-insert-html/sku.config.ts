import type { SkuConfig } from 'sku';

export default {
  buildType: 'ssr',
  publicPath: '/static/stream-insert-html/',
  port: 8210,
  target: 'dist',
  csp: { enforced: true },
} satisfies SkuConfig;
