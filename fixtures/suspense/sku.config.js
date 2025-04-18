import { makeStableHashes } from '@sku-private/test-utils';

export default {
  sites: [
    {
      name: 'au',
      host: 'dev.seek.com.au',
      routes: [{ route: '/', name: 'home' }],
    },
  ],
  clientEntry: 'src/client.jsx',
  renderEntry: 'src/render.jsx',
  environments: ['production'],
  port: 8203,
  publicPath: '/static/suspense',
  dangerouslySetWebpackConfig: (config) => makeStableHashes(config),
  skipPackageCompatibilityCompilation: ['react-router-dom'],
};
