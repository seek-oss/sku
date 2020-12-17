module.exports = {
  clientEntry: 'src/client.tsx',
  renderEntry: 'src/render.tsx',
  serverEntry: 'src/server.tsx',
  setupTests: 'src/setupTests.js',
  languages: ['en', 'fr'],
  routes: ['/$language'],
  initialPath: '/en',
  target: 'dist-ssr',
  port: 8313,
  serverPort: 8314,
};
