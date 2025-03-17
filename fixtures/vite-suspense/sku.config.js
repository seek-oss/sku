import { makeStableHashes } from '@sku-private/test-utils';

export default {
  __UNSAFE_EXPERIMENTAL__bundler: 'vite',
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
  port: 8206,
  publicPath: '/static/suspense',
  dangerouslySetWebpackConfig: (config) => makeStableHashes(config),
  skipPackageCompatibilityCompilation: ['react-router-dom'],
};
