import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  sites: [
    {
      name: 'au',
      host: 'dev.seek.com.au',
      routes: [
        { route: '/', name: 'home' },
        { route: '/details/$id', name: 'details' },
      ],
    },
    {
      name: 'nz',
      host: 'dev.seek.co.nz',
      routes: [
        { route: '/nz', name: 'home' },
        { route: '/nz/details/:id', name: 'details' },
      ],
    },
  ],
  clientEntry: 'src/client.jsx',
  serverEntry: 'src/server.jsx',
  renderEntry: 'src/render.jsx',
  port: 8303,
  target: 'dist',
  sourceMapsProd: true,
} satisfies SkuConfig;
