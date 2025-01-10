export default {
  bundler: 'vite',
  renderEntry: 'src/render.jsx',
  clientEntry: 'src/client.jsx',
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
  skipPackageCompatibilityCompilation: ['react-router-dom'],
};
