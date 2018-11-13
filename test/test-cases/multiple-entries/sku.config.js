module.exports = {
  routes: [
    { name: 'home', entry: 'src/HomePage.js', route: '/' },
    { name: 'details', entry: 'src/DetailsPage.js', route: '/details' }
  ],
  sites: ['au', 'nz'],
  publicPath: 'https://www.seekcdn.com.au/someapp'
};
