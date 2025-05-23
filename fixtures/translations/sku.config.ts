import { makeStableHashes } from '@sku-private/test-utils';
import type { SkuConfig } from 'sku';

export default {
  clientEntry: 'src/client.tsx',
  renderEntry: 'src/render.tsx',
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
  dangerouslySetWebpackConfig: (config) => makeStableHashes(config),
} satisfies SkuConfig;
