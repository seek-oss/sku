module.exports = {
  srcPaths: ['lib', 'another-folder'],
  entry: {
    client: 'lib/client.js',
    render: 'lib/render.js'
  },
  target: 'dist',
  publicPath: '/',
  port: 8080
};
