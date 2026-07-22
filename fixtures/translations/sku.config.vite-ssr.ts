import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  buildType: 'ssr',
  clientEntry: 'src/vite-ssr/client.tsx',
  serverEntry: 'src/vite-ssr/server.tsx',
  languages: ['en', 'fr'],
  publicPath: '/static/translations/',
  target: 'dist-vite-ssr',
  port: 8315,
} satisfies SkuConfig;
