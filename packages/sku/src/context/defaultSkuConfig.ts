import browserslistConfigSeek from 'browserslist-config-seek';
import { join } from 'node:path';
import isCompilePackage from '@/utils/isCompilePackage.js';
import type { SkuConfig } from '@/types/types.js';

const defaultDecorator = <T>(a: T) => a;

export default {
  bundler: 'webpack',
  clientEntry: 'src/client.js',
  renderEntry: 'src/render.js',
  serverEntry: 'src/server.js',
  libraryEntry: undefined,
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
  setupTests: undefined,
  initialPath: undefined,
  public: 'public',
  publicPath: '/',
  polyfills: [],
  libraryName: undefined,
  libraryFile: undefined,
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
  devServerMiddleware: undefined,
  rootResolution: !isCompilePackage,
  languages: undefined,
  skipPackageCompatibilityCompilation: [],
  externalizeNodeModules: false,
} satisfies SkuConfig;
