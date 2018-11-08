module.exports = {
  entry: {
    client: 'src/client.js',
    server: 'src/server.js'
  },
  target: 'dist',
  publicPath: 'http://localhost:8000/',
  port: 8000,
  serverPort: 8001
};
