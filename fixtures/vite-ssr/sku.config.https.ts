import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  renderType: 'server-side-rendered',
  appEntry: 'src/app.tsx',
  serverEntry: 'src/server.ts',
  clientEntry: 'src/client.ts',
  port: 8202,
  target: 'dist',
  httpsDevServer: true,
  languages: ['en', 'fr'],
  cspEnabled: true,
} satisfies SkuConfig;
