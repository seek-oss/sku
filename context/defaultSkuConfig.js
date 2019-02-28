const supportedBrowsers = require('browserslist-config-seek');
const path = require('path');

const defaultDecorator = a => a;

module.exports = {
  clientEntry: 'src/client.js',
  renderEntry: 'src/render.js',
  serverEntry: 'src/server.js',
  libraryEntry: null,
  routes: [{ name: 'default', route: '/' }],
  sites: [],
  environments: [],
  transformOutputPath: ({ environment = '', site = '', route = '' }) =>
    path.join(environment, site, route),
  srcPaths: ['./src'],
  env: {},
  compilePackages: [],
  hosts: ['localhost'],
  port: 8080,
  serverPort: 8181,
  target: 'dist',
  setupTests: null,
  storybookPort: 8081,
  storybookTarget: null,
  initialPath: null,
  public: 'public',
  publicPath: '/',
  polyfills: [],
  libraryName: null,
  sourceMapsProd: false,
  dangerouslySetWebpackConfig: defaultDecorator,
  dangerouslySetJestConfig: defaultDecorator,
  dangerouslySetESLintConfig: defaultDecorator,
  supportedBrowsers,
};
