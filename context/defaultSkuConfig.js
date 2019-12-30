const supportedBrowsers = require('browserslist-config-seek');
const path = require('path');
const isTypeScript = require('../lib/isTypeScript');

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
  storybookTarget: 'dist-storybook',
  screenshotWidths: [320, 1200],
  initialPath: null,
  public: 'public',
  publicPath: '/',
  polyfills: [],
  libraryName: null,
  sourceMapsProd: false,
  displayNamesProd: false,
  dangerouslySetWebpackConfig: defaultDecorator,
  dangerouslySetJestConfig: defaultDecorator,
  dangerouslySetESLintConfig: defaultDecorator,
  supportedBrowsers,
  playroomTarget: 'dist-playroom',
  playroomWidths: [320, 768, 1024],
  playroomComponents: `src/components/index.${isTypeScript ? 'ts' : 'js'}`,
  playroomThemes: null,
  playroomFrameComponent: null,
  playroomTitle: null,
  playroomPort: 8082,
};
