import { makeStableViteHashes } from '@sku-private/test-utils';

export default {
  sites: [
    {
      name: 'au',
      host: 'au.seek.com.localhost',
      routes: [{ route: '/', name: 'home' }],
    },
  ],
  clientEntry: 'src/client.jsx',
  renderEntry: 'src/render.jsx',
  environments: ['production'],
  port: 8203,
  publicPath: '/static/suspense',
  setupTests: './setupTests.js',
  dangerouslySetViteConfig: makeStableViteHashes,
};
