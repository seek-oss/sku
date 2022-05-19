export default {
  sites: [
    {
      name: 'au',
      host: 'dev.seek.com.au',
      routes: [
        { route: '/', name: 'home' },
        { route: '/details/:id', name: 'details' },
      ],
    },
    {
      name: 'nz',
      routes: [
        { route: '/nz', name: 'home' },
        { route: '/nz/details/:id', name: 'details' },
      ],
      host: 'dev.seek.co.nz',
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
  skipPackageCompatibilityCompilation: ['react-router-dom'],
};
