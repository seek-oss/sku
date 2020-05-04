module.exports = {
  routes: ['/', '/details/$id'],
  sites: ['au', 'nz'],
  environments: ['production'],
  port: 8202,
  publicPath: '/static/place',
  cspEnabled: true,
  cspExtraHosts: ['https://error-tracking.com', 'https://fb-tracking.com'],
};
