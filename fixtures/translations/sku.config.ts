import { SkuConfig } from 'sku';

export default {
  clientEntry: 'src/client.tsx',
  renderEntry: 'src/render.tsx',
  serverEntry: 'src/server.tsx',
  setupTests: 'src/setupTests.js',
  languages: ['en', { name: 'fr', extends: 'en' }],
  routes: [
    { route: '/', languages: ['en'] },
    { route: '/hello', languages: ['en'] },
    { route: '/bonjour', languages: ['fr'] },
    '/$language',
  ],
  initialPath: '/en/',
  target: 'dist',
  port: 8310,
} satisfies SkuConfig;