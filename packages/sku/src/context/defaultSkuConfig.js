import browserslistConfigSeek from 'browserslist-config-seek';
import { join } from 'node:path';
import isCompilePackage from '../lib/isCompilePackage.js';

const defaultDecorator = (a) => a;

/** @type {import("../../sku-types.d.ts").SkuConfig} */
export default {
  clientEntry: 'src/client.js',
  renderEntry: 'src/render.js',
  serverEntry: 'src/server.js',
  libraryEntry: null,
  routes: [],
  sites: [],
  environments: [],
  transformOutputPath: ({ environment = '', site = '', route = '' }) =>
    join(environment, site, route),
  srcPaths: ['./src'],
  compilePackages: [],
  hosts: ['localhost'],
  port: 8080,
  serverPort: 8181,
  target: 'dist',
  setupTests: null,
  initialPath: null,
  public: 'public',
  publicPath: '/',
  polyfills: [],
  libraryName: null,
  libraryFile: null,
  sourceMapsProd: true,
  displayNamesProd: false,
  dangerouslySetWebpackConfig: defaultDecorator,
  dangerouslySetJestConfig: defaultDecorator,
  dangerouslySetESLintConfig: defaultDecorator,
  dangerouslySetTSConfig: defaultDecorator,
  eslintIgnore: [],
  supportedBrowsers: browserslistConfigSeek,
  cspEnabled: false,
  cspExtraScriptSrcHosts: [],
  httpsDevServer: false,
  devServerMiddleware: null,
  rootResolution: !isCompilePackage,
  languages: null,
  skipPackageCompatibilityCompilation: [],
  externalizeNodeModules: false,
};
