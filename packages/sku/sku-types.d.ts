import type { ComponentType, ReactNode } from 'react';

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

interface RenderAppProps extends SharedRenderProps {
  SkuProvider: ComponentType<{ children: ReactNode }>;
  _addChunk: (chunkName: string) => void;
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

interface SkuRouteObject {
  route: string;
  name?: string;
  entry?: string;
  languages?: readonly string[];
}

type SkuRoute = string | SkuRouteObject;

interface SkuSiteObject {
  name: string;
  host?: string;
  routes?: readonly SkuRoute[];
  languages?: readonly string[];
}

type SkuSite = string | SkuSiteObject;

interface TranformOutputPathFunctionParams {
  environment: string;
  site: string;
  path: string;
}
type TranformOutputPathFunction = (
  input: TranformOutputPathFunctionParams,
) => string;

type SkuLanguage = string | { name: string; extends?: string };

export interface SkuConfig {
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
   * Similar to {@link dangerouslySetWebpackConfig}, but for ESLint config.
   *
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=dangerouslyseteslintconfig
   */
  dangerouslySetESLintConfig?: (existingESLintConfig: any) => any;

  /**
   * Similar to {@link dangerouslySetWebpackConfig}, but for Jest config. Make sure {@link setupTests} definitely doesn’t cover your needs before using.
   * Please speak with the `sku-support` group before using.
   *
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=dangerouslysetjestconfig
   */
  dangerouslySetJestConfig?: (existingJestConfig: any) => any;

  /**
   * Similar to {@link dangerouslySetWebpackConfig}, but for TypeScript (`tsconfig.json`).
   *
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=dangerouslysettsconfig
   */
  dangerouslySetTSConfig?: (existingTSConfig: any) => any;

  /**
   * This function provides a way to override the webpack config after sku has created it.
   * Ideally, this setting is not needed and only used for experimenting/debugging. If you require webpack features not currently supported by sku please speak to the `sku-support` group.
   *
   * Reliance on this setting will cause issues when upgrading sku as any custom settings may break at anytime. You’ve been warned!
   *
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=dangerouslysetwebpackconfig
   */
  dangerouslySetWebpackConfig?: (existingWebpackConfig: any) => any;

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
   * Enables linting of import order. This rule supports auto-fix.
   *
   * @link https://seek-oss.github.io/sku/#/./docs/linting?id=import-ordering
   */
  orderImports?: boolean;

  /**
   * Disables the use of webpack filesystem caching for `sku start` and `sku start-ssr`.
   *
   * @default true
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=persistentcache
   */
  persistentCache?: boolean;

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
   * An array of storybook addons to use.
   *
   * @default []
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=storybookaddons
   */
  storybookAddons?: string[];

  /**
   * The port to host storybook on when running `sku storybook`.
   *
   * @default 8081
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=storybookport
   */
  storybookPort?: number;

  /**
   * Allows disabling Storybook's `storyStoreV7` feature flag. This will result in all stories being
   * loaded upfront instead of on demand. Disabling this feature will allow stories that use the
   * deprecated `storiesOf` API to work, however it's highly recommended to migrate off `storiesOf`
   * to the Component Story Format (CSF) instead.
   * @default true
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=storybookStoryStore
   */
  storybookStoryStore?: boolean;

  /**
   * The directory `sku build-storybook` will output files to.
   *
   * @default 'dist-storybook'
   * @link https://seek-oss.github.io/sku/#/./docs/configuration?id=storybooktarget
   */
  storybookTarget?: string;

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
  transformOutputPath?: TranformOutputPathFunction;
}
