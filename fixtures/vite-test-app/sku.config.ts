import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  clientEntry: 'src/client.jsx',
  renderEntry: 'src/render.jsx',
  publicPath: '/static/source-maps',
  port: 8303,
  target: 'dist',
  sourceMapsProd: true,
} satisfies SkuConfig;
