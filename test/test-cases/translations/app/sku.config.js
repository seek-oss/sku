module.exports = {
  clientEntry: 'src/client.tsx',
  renderEntry: 'src/render.tsx',
  serverEntry: 'src/server.tsx',
  setupTests: 'src/setupTests.js',
  languages: ['en', 'fr'],
  sites: [
    {
      name: 'main',
      routes: [
        { route: '/', languages: ['en'] },
        { route: '/hello', languages: ['en'] },
        { route: '/bonjour', languages: ['fr'] },
        '/$language',
      ],
    },
  ],
  initialPath: '/en/',
  target: 'dist',
  port: 8310,
};
