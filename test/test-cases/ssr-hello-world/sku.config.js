module.exports = {
  entry: {
    client: 'src/client.js',
    server: 'src/server.js'
  },
  target: 'dist',
  publicPath: 'http://localhost:8000/',
  port: { client: 8000, backend: 8001 }
};
