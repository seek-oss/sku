import { makeStableHashes } from '@sku-private/test-utils';

export default {
  clientEntry: './src/client.jsx',
  renderEntry: './src/render.jsx',
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
  environments: ['production'],
  port: 8202,
  publicPath: '/static/place',
  cspEnabled: true,
  cspExtraScriptSrcHosts: [
    'https://error-tracking.com',
    'https://fb-tracking.com',
  ],
  dangerouslySetWebpackConfig: (config) => makeStableHashes(config),
  skipPackageCompatibilityCompilation: ['react-router-dom'],
};
