module.exports = {
  srcPaths: [
    'src',
    'another-folder'
  ],
  entry: {
    client: 'src/client.js',
    render: 'src/render.js'
  },
  target: 'dist',
  publicPath: '/',
  port: 8080
};
