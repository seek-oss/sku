import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  buildType: 'ssr',
  clientEntry: 'src/client/client.tsx',
  serverEntry: 'src/server/server.tsx',
  publicPath: '/static/logging/',
  port: 8212,
  target: 'dist',
} satisfies SkuConfig;
