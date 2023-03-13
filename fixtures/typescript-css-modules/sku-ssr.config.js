module.exports = {
  clientEntry: 'src/client-ssr.tsx',
  serverEntry: 'src/server.tsx',
  port: 4003,
  serverPort: 8010,
  // Required for test to serve client assets correctly
  publicPath: 'http://localhost:4003/',
};
