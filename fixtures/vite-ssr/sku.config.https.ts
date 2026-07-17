import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  buildType: 'ssr',
  port: 8202,
  target: 'dist',
  httpsDevServer: true,
  languages: ['en', 'fr'],
  cspEnabled: true,
} satisfies SkuConfig;
