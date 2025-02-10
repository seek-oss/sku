import type { ReactNode } from 'react';
import type { Express, RequestHandler } from 'express';
import type { ChunkExtractor } from '@loadable/server';
import type { Linter } from 'eslint';
import type { RenderToPipeableStreamOptions } from 'react-dom/server';
import type { Collector } from '@/services/vite/preload/collector.js';

export interface ViteRenderCallbackParams {
  url?: string;
  site?: string;
  options: RenderToPipeableStreamOptions;
  collector: Collector;
}

export interface RenderCallbackParams {
  SkuProvider: ({ children }: { children: ReactNode }) => ReactNode;
  addLanguageChunk: (language: string) => void;
  getBodyTags: () => string;
  getHeadTags: (options?: {
    excludeJs?: boolean;
    excludeCss?: boolean;
  }) => string;
  flushHeadTags: (options?: {
    excludeJs?: boolean;
    excludeCss?: boolean;
  }) => string;
  extractor: ChunkExtractor;
  registerScript?: (script: string) => void;
}

export interface Server {
  renderCallback: (
    params: RenderCallbackParams,
    ...requestHandlerParams: Parameters<RequestHandler>
  ) => void;
  onStart?: (app: Express) => void;
  middleware?: RequestHandler | RequestHandler[];
}

interface SharedRenderProps {
  routeName: string;
  route: string;
  environment: string;
  site: string;
  language: string;
  libraryName: string;
  libraryFile: string;
  // Webpack use an any here. PR for better type welcome.
  webpackStats: any;
}

export interface RenderAppProps extends SharedRenderProps {
  SkuProvider: ({ children }: { children: ReactNode }) => JSX.Element;
  _addChunk: (chunkName: string) => void;
  renderToStringAsync: (element: ReactNode) => Promise<string>;
}

interface RenderDocumentProps<App> extends SharedRenderProps {
  app: App;
  headTags: string;
  bodyTags: string;
}

export interface Render<App = string> {
  renderApp(p: RenderAppProps): Promise<App> | App;

  provideClientContext?(
    p: SharedRenderProps & {
      app: App;
    },
  ): Promise<any> | any;

  renderDocument(p: RenderDocumentProps<App>): Promise<string> | string;
}

export interface SkuRouteObject {
  route: string;
  name?: string;
  entry?: string;
  languages?: readonly string[];
}

export type SkuRoute = string | SkuRouteObject;

export interface SkuSiteObject {
  name: string;
  host?: string;
  routes?: readonly SkuRoute[];
  languages?: readonly string[];
}

type SkuSite = string | SkuSiteObject;

export interface TransformOutputPathFunctionParams {
  environment: string | undefined;
  site: string | undefined;
  route: string;
}

type TransformOutputPathFunction = (
  input: TransformOutputPathFunctionParams,
) => string;

export type SkuLanguage = string | { name: string; extends?: string };

export interface SkuConfig {
  /**
   * The bundler to use for the app. 'vite' is currently experimental.
   *
   * @default 'webpack'
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=bundler
   */
  bundler?: 'webpack' | 'vite';
  /**
   * The client entry point to the app. The client entry is the file that executes your browser code.
   *
   * @default "./src/client.js"
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=cliententry
   */
  clientEntry?: string;

  /**
   * An array of `node_modules` to be compiled as if they were part of your source code.
   *
   * Ideally, this setting should only be used for internally controlled packages.
   *
   * @default "[]"
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=compilepackages
   */
  compilePackages?: string[];

  /**
   * **Unavailable for libraries**
   *
   * Enable content security policy feature. More info at https://seek-oss.github.io/sku/#/./docs/csp
   *
   * @default false
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=cspenabled
   */
  cspEnabled?: boolean;

  /**
   * Extra external hosts to allow in your `script-src` content security policy. Only relevant if {@link cspEnabled} is set to `true`.
   *
   * @default []
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=cspextrascriptsrchosts
   */
  cspExtraScriptSrcHosts?: string[];

  /**
   * This function provides a way to modify sku's ESLint configuration.
   * It should only be used in exceptional circumstances where a solution cannot be achieved by adjusting standard configuration options.
   *
   * Before customizing your ESLint configuration, please reach out in [#sku-support](https://seek.enterprise.slack.com/archives/CDL5VP5NU) to discuss your requirements and potential alternative solutions.
   *
   * ESLint rules help to maintain code quality and consistency.
   * Some rules even prevent potential bugs in your code, e.g. React rules.
   * Rather than disabling a rule purely because it causes frequent errors, consider whether these errors may be a symptom of a larger problem in your codebase.
   *
   * If you believe other consumers would benefit from the addition/removal/modificaton of a rule, consider contributing the change to [`eslint-config-seek`](https://github.com/seek-oss/eslint-config-seek).
   *
   * Sku provides no guarantees that its ESLint configuration will remain compatible with any customizations made within this function.
   * It is the responsibility of the user to ensure that their customizations are compatible with sku.
   *
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=dangerouslyseteslintconfig
   */
  dangerouslySetESLintConfig?: (
    skuESLintConfig: Linter.Config[],
  ) => Linter.Config[];

  /**
   * This function provides a way to modify sku's Jest configuration.
   * It should only be used in exceptional circumstances where a solution cannot be achieved by adjusting standard configuration options.
   *
   * Before customizing your Jest configuration, please reach out in [#sku-support](https://seek.enterprise.slack.com/archives/CDL5VP5NU) to discuss your requirements and potential alternative solutions.
   *
   * Sku provides no guarantees that its Jest configuration will remain compatible with any customizations made within this function.
   * It is the responsibility of the user to ensure that their customizations are compatible with sku.
   *
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=dangerouslysetjestconfig
   */
  dangerouslySetJestConfig?: (skuJestConfig: any) => any;

  /**
   * This function provides a way to modify sku's TypeScript configuration.
   * It should only be used in exceptional circumstances where a solution cannot be achieved by adjusting standard configuration options.
   *
   * Before customizing your TypeScript configuration, please reach out in [#sku-support](https://seek.enterprise.slack.com/archives/CDL5VP5NU) to discuss your requirements and potential alternative solutions.
   *
   * Sku provides no guarantees that its TypeScript configuration will remain compatible with any customizations made within this function.
   * It is the responsibility of the user to ensure that their customizations are compatible with sku.
   *
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=dangerouslysettsconfig
   */
  dangerouslySetTSConfig?: (skuTSConfig: any) => any;

  /**
   * This function provides a way to modify sku's Webpack configuration.
   * It should only be used in exceptional circumstances where a solution cannot be achieved by adjusting standard configuration options.
   *
   * Before customizing your Webpack configuration, please reach out in [#sku-support](https://seek.enterprise.slack.com/archives/CDL5VP5NU) to discuss your requirements and potential alternative solutions.
   *
   * As sku creates two webpack configs (`client` & `server|render`), this function will actually run twice.
   * If you only need to modify one of these configs, then you can check `config.name` within.
   *
   * Sku provides no guarantees that its Webpack configuration will remain compatible with any customizations made within this function.
   * It is the responsibility of the user to ensure that their customizations are compatible with sku.
   *
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=dangerouslysetwebpackconfig
   */
  dangerouslySetWebpackConfig?: (skuWebpackConfig: any) => any;

  /**
   * Path to a file in your project that exports a function that can receive the Express server.
   * This can be used to extend to the dev server middleware.
   *
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=devservermiddleware
   */
  devServerMiddleware?: string;

  /**
   * Adds static `displayName` properties to React components in production.
   * This setting is designed for usage on sites that generate React code snippets, e.g. Braid.
   *
   * @default false
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=displaynamesprod
   */
  displayNamesProd?: boolean;

  /**
   * **Only for static apps**
   *
   * An array of environments the app supports.
   * Apps should have one environment for local development plus one for each environment they’re deployed to.
   *
   * @default []
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=environments
   */
  environments?: readonly string[];

  /**
   * Paths and files to be ignored by ESLint.
   * See [the ESLint documentation](https://eslint.org/docs/latest/use/configure/ignore#ignoring-files) for more information.
   *
   * @default []
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=eslintIgnore
   */
  eslintIgnore?: readonly string[];

  /**
   * By default, sku compiles all node_modules in builds that target node.
   * Setting this option to `true` will instead externalize all node_modules, excluding `compilePackages`.
   *
   * @default false
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=externalizenodemodules
   */
  externalizeNodeModules?: boolean;

  /**
   * An array of custom hosts the app can be served off when running `sku start`.
   * You must have configured your hosts file to point to localhost as well.
   *
   * @default ['localhost']
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=hosts
   */
  hosts?: readonly string[];

  /**
   * Whether or not to use https for the local development server with a self-signed certificate.
   * This is useful when testing authentication flows that require access to `window.crypto`.
   *
   * @default false
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=httpsdevserver
   */
  httpsDevServer?: boolean;

  /**
   * The browser URL to open when running `sku start` or `sku start-ssr`.
   * It will default to the first `route` in the {@link routes} array.
   *
   * @default routes[0].route
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=initialpath
   */
  initialPath?: string;

  /**
   * The languages your application supports.
   *
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=languages
   */
  languages?: readonly SkuLanguage[];

  /**
   * **Only for libraries**
   *
   * The entry file for the library. If set, sku will assume the project is a library. Must export its API from this file.
   *
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=libraryentry
   */
  libraryEntry?: string;

  /**
   * **Only for libraries**
   *
   * The global name of the library. Will be added to the `window` object under `window[libraryName]`.
   *
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=libraryname
   */
  libraryName?: string;

  /**
   * **Only for libraries**
   *
   * The file name of the library. The main bundle of the library will be output to `dist/${libraryFile}.js` - note that the
   * `.js` extension will be added automatically and should not be included in the configuration option itself.
   *
   * If `libraryFile` is not specified then `libraryName` will be used instead.
   *
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=libraryfile
   */
  libraryFile?: string;

  /**
   * An array of polyfills to be included into all client entry points.
   *
   * @default []
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=polyfills
   */
  polyfills?: string[];

  /**
   * The port the app is hosted on when running `sku start`.
   *
   * @default 8080
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=port
   */
  port?: number;

  /**
   * A folder of public assets to be copied into the `target` directory after `sku build` or `sku build-ssr`.
   *
   * *Caution*: All assets should ideally be imported through the source code to ensure they are named correctly for long term caching.
   * You may run into caching issues using this option. It may be removed in future.
   *
   * @default 'public'
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=public
   */
  public?: string;

  /**
   * The URL all the static assets of the app are accessible under.
   *
   * @default '/'
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=publicpath
   */
  publicPath?: string;

  /**
   * **Only for static apps and libraries**
   *
   * The render entry file to the app. This file should export the required functions for static rendering.
   *
   * @default "./src/render.js"
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=renderentry
   */
  renderEntry?: string;

  /**
   * Enables root resolution.
   *
   * By default, sku allows importing from the root of the project e.g. `import something from 'src/modules/something'`.
   *
   * Unfortunately, these kinds of imports only work for apps.
   * In packages, the imports will work locally, but fail when consumed from `node_modules`.
   *
   * @default true
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=rootresolution
   */
  rootResolution?: boolean;

  /**
   * **Only for static apps**
   *
   * An array of routes for the app. Each route must specify a name and a route corresponding to the path it is hosted under. Each route may also have a custom client entry, which can help with bundle splitting. See static-rendering for more info.
   *
   * Can be used to limit the languages rendered for a specific route. Any listed language must exist in the top level languages attribute.
   *
   * @default ['/']
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=routes
   */
  routes?: readonly SkuRoute[];

  /**
   * **Only for SSR apps**
   *
   * The entry file for the server.
   *
   * @default "./src/server.js"
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=serverentry
   */
  serverEntry?: string;

  /**
   * **Only for SSR apps**
   *
   * The port the server is hosted on when running `sku start-ssr`.
   *
   * @default 8181
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=serverport
   */
  serverPort?: number;

  /**
   * Point to a JS file that will run before your tests to setup the testing environment.
   *
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=setuptests
   */
  setupTests?: string | string[];

  /**
   * **Only for static apps**
   *
   * An array of sites the app supports. These usually correspond to each domain the app is hosted under.
   *
   * @default []
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=sites
   */
  sites?: readonly SkuSite[];

  /**
   * When running `sku build`, sku will compile all your external packages (`node_modules`) through `@babel/preset-env`.
   * This is to ensure external packages satisfy the browser support policy.
   * However, this can cause very slow builds when large packages are processed.
   *
   * The `skipPackageCompatibilityCompilation` option allows you to pass a list of trusted packages to skip this behaviour.
   *
   * @default []
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=skippackagecompatibilitycompilation
   */
  skipPackageCompatibilityCompilation?: string[];

  /**
   * Source maps are always generated for development builds.
   * To disable source maps for production builds, set this option to `false`.
   *
   * @default true
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=sourcemapsprod
   */
  sourceMapsProd?: boolean;

  /**
   * An array of directories holding your apps source code.
   * By default, sku expects your source code to be in a directory named `src` in the root of your project.
   *
   * Use this option if your source code needs to be arranged differently.
   *
   * @default ['./src']
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=srcpaths
   */
  srcPaths?: string[];

  /**
   * The `browserslist` query describing the apps browser support policy.
   *
   * @default browserslist-config-seek
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=supportedbrowsers
   */
  supportedBrowsers?: string[];

  /**
   * The directory to build your assets into when running `sku build` or `sku build-ssr`.
   *
   * @default 'dist'
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=target
   */
  target?: string;

  /**
   * **Only for static apps**
   *
   * This function returns the output path within {@link target} for each rendered page. Generally, this value should be sufficient.
   *
   * If you think you need to modify this setting, please reach out to the `sku-support` group first to discuss.
   *
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=transformoutputpath
   */
  transformOutputPath?: TransformOutputPathFunction;
}
