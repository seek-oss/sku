import { makeStableHashes } from '@sku-private/test-utils';

export default {
  sites: [
    {
      name: 'au',
      host: 'dev.seek.com.au',
      routes: [
        { route: '/', name: 'home' },
        { route: '/one', name: 'one' },
        { route: '/two', name: 'two' },
        { route: '/three', name: 'three' },
        { route: '/four', name: 'four' },
        { route: '/five', name: 'five' },
        { route: '/six', name: 'six' },
        { route: '/seven', name: 'seven' },
        { route: '/eight', name: 'eight' },
        { route: '/nine', name: 'nine' },
      ],
    },
    {
      name: 'nz',
      host: 'dev.seek.co.nz',
      routes: [
        { route: '/nz', name: 'home' },
        { route: '/nz/one', name: 'one' },
        { route: '/nz/two', name: 'two' },
        { route: '/nz/three', name: 'three' },
        { route: '/nz/four', name: 'four' },
        { route: '/nz/five', name: 'five' },
        { route: '/nz/six', name: 'six' },
        { route: '/nz/seven', name: 'seven' },
        { route: '/nz/eight', name: 'eight' },
        { route: '/nz/nine', name: 'nine' },
      ],
    },
  ],
  clientEntry: './src/client.jsx',
  renderEntry: './src/render.jsx',
  environments: ['production'],
  port: 8206,
  publicPath: '/static/place',
  cspEnabled: true,
  cspExtraScriptSrcHosts: [
    'https://error-tracking.com',
    'https://fb-tracking.com',
  ],
  dangerouslySetWebpackConfig: (config) => makeStableHashes(config),
  skipPackageCompatibilityCompilation: ['react-router-dom'],
};
