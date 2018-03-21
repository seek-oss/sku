module.exports = {
  entry: {
    client: 'src/client.js',
    server: 'src/server.js'
  },
  target: 'dist',
  port: { client: 8000, backend: 8001 }
};
