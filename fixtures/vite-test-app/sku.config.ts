import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  clientEntry: 'src/client.jsx',
  serverEntry: 'src/server.jsx',
  renderEntry: 'src/render.jsx',
  port: 8303,
  target: 'dist',
  sourceMapsProd: true,
} satisfies SkuConfig;
