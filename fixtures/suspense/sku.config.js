import { makeStableHashes } from '@sku-private/test-utils';

export default {
  sites: [
    {
      name: 'au',
      host: 'dev.seek.com.au',
      routes: [{ route: '/', name: 'home' }],
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