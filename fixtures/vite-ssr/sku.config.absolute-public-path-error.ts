import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  renderType: 'server-side-rendered',
  appEntry: 'src/app.tsx',
  port: 8202,
  target: 'dist-cdn',
  publicPath: 'https://cdn.example.com/assets/',
  cspEnabled: true,
} satisfies SkuConfig;
