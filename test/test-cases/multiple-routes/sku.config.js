module.exports = {
  routes: [
    { name: 'home', route: '/' },
    { name: 'details', route: '/details/:id' }
  ],
  sites: ['au', 'nz'],
  environments: ['production'],
  port: 8202,
  publicPath: 'http://localhost:4004'
};
