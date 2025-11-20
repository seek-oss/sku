import browserslistConfigSeek from 'browserslist-config-seek';
import { join } from 'node:path';
import isCompilePackage from '../utils/isCompilePackage.js';
import type { CompleteSkuConfig } from '../types/types.js';

const defaultDecorator = <T>(a: T) => a;

export default {
  bundler: 'webpack',
  testRunner: 'jest',
  clientEntry: 'src/client.tsx',
  renderEntry: 'src/render.tsx',
  serverEntry: 'src/server.tsx',
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
  dangerouslySetJestConfig: defaultDecorator,
  dangerouslySetESLintConfig: defaultDecorator,
  dangerouslySetTSConfig: defaultDecorator,
  // Since dangerouslySetWebpackConfig is in a union type, we need to pass the generic type to satisfy type checking.
  dangerouslySetWebpackConfig: defaultDecorator<any>,
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
  __UNSAFE_EXPERIMENTAL__cjsInteropDependencies: [],
  pathAliases: {},
  dangerouslySetViteConfig: undefined,
  dangerouslySetVitestConfig: undefined,
} satisfies CompleteSkuConfig;
