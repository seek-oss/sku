const defaultDecorator = a => a;

module.exports = {
  entry: {
    client: 'src/client.js',
    render: 'src/render.js',
    server: 'src/server.js'
  },
  srcPaths: ['./src'],
  env: {},
  compilePackages: [],
  hosts: ['localhost'],
  port: 8080,
  serverPort: 8181,
  target: 'dist',
  storybookPort: 8081,
  initialPath: '/',
  public: 'public',
  publicPath: '/',
  polyfills: [],
  libraryName: null,
  dangerouslySetWebpackConfig: defaultDecorator,
  dangerouslySetJestConfig: defaultDecorator,
  dangerouslySetESLintConfig: defaultDecorator,
  locales: ['']
};
