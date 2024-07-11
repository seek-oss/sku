const supportedBrowsers = require('browserslist-config-seek');
const path = require('node:path');
const isCompilePackage = require('../lib/isCompilePackage');

const defaultDecorator = (a) => a;

/** @type {import("../").SkuConfig} */
module.exports = {
  clientEntry: 'src/client.js',
  renderEntry: 'src/render.js',
  serverEntry: 'src/server.js',
  libraryEntry: null,
  routes: [],
  sites: [],
  environments: [],
  transformOutputPath: ({ environment = '', site = '', route = '' }) =>
    path.join(environment, site, route),
  srcPaths: ['./src'],
  compilePackages: [],
  hosts: ['localhost'],
  port: 8080,
  serverPort: 8181,
  target: 'dist',
  setupTests: null,
  storybookPort: 8081,
  storybookTarget: 'dist-storybook',
  storybookAddons: [],
  storybookStoryStore: true,
  initialPath: null,
  public: 'public',
  publicPath: '/',
  polyfills: [],
  libraryName: null,
  libraryFile: null,
  sourceMapsProd: false,
  displayNamesProd: false,
  dangerouslySetWebpackConfig: defaultDecorator,
  dangerouslySetJestConfig: defaultDecorator,
  dangerouslySetESLintConfig: defaultDecorator,
  dangerouslySetTSConfig: defaultDecorator,
  supportedBrowsers,
  cspEnabled: false,
  cspExtraScriptSrcHosts: [],
  httpsDevServer: false,
  devServerMiddleware: null,
  rootResolution: !isCompilePackage,
  languages: null,
  skipPackageCompatibilityCompilation: [],
  externalizeNodeModules: false,
};
