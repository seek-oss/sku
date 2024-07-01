# Configuration

If you need to configure sku, first create a `sku.config.ts` file in your project root:

```sh
$ touch sku.config.ts
```

While sku has a zero configuration mode, the equivalent manual configuration would look like this:

```ts
import type { SkuConfig } from 'sku';

export default {
  clientEntry: 'src/client.js',
  renderEntry: 'src/render.js',
  public: 'src/public',
  publicPath: '/',
  target: 'dist',
} satisfies SkuConfig;
```

If you need to specify a different config file you can do so with the `--config` parameter.

```sh
$ sku start --config sku.custom.config.ts
```

Config files can use either TypeScript or JavaScript.

## clientEntry

type `string`

Default: `./src/client.js`

The client entry point to the app. The client entry is the file that executes your browser code.

Each `route` can also specify a client entry, if none is specified the `clientEntry` is used. See [`routes`](#routes) for more info.

## compilePackages

type `Array<string>`

Default: `[]`

An array of `node_modules` to be compiled as if they were part of your source code. This allows the use of packages that make use of CSS Modules or TypeScript without having them be pre compiled. Ideally, this setting should only be used for internally controlled packages.

## cspEnabled

type `boolean`

**Unavailable for libraries**

Default: `false`

Enable content security policy feature. See [`Content Security Policy`](./docs/csp.md) for more info.

## cspExtraScriptSrcHosts

type `Array<string>`

Default: `[]`

Extra external hosts to allow in your `script-src` [content security policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP). Only relevant if `cspEnabled` is set to `true`.

## dangerouslySetESLintConfig

type `function`

Similar to `dangerouslySetWebpackConfig`, but for [ESLint](https://eslint.org/) config.

Example:

```ts
export default {
  dangerouslySetESLintConfig: (skuEslintConfig) => ({
    ...skuEslintConfig,
    someOtherConfig: 'dangerousValue',
  }),
} satisfies SkuConfig;
```

## dangerouslySetJestConfig

type `function`

Similar to `dangerouslySetWebpackConfig`, but for [Jest](https://jestjs.io/docs/en/configuration) config. Make sure [`setupTests`](#setuptests) definitely doesn't cover your needs before using.

Please speak with the `sku-support` group before using.

Example:

```ts
export default {
  dangerouslySetJestConfig: (skuJestConfig) => ({
    ...skuJestConfig,
    someOtherConfig: 'dangerousValue',
  }),
} satisfies SkuConfig;
```

## dangerouslySetTSConfig

type `function`

Similar to `dangerouslySetWebpackConfig`, but for [TypeScript (`tsconfig.json`)](https://www.typescriptlang.org/tsconfig).

Example:

```ts
export default {
  dangerouslySetTSConfig: (skuTSConfig) => ({
    ...skuTSConfig,
    include: ['packages', 'site'],
    exclude: ['**/scripts'],
  }),
} satisfies SkuConfig;
```

## dangerouslySetWebpackConfig

type `function`

This function provides a way to override the webpack config after sku has created it. As sku creates two webpack configs (`client` & `server|render`) this function will actually run twice, if you only need to modify one, then you can check `config.name`.

Ideally, this setting is not needed and only used for experimenting/debugging. If you require webpack features not currently supported by sku please speak to the `sku-support` group.

Reliance on this setting will cause issues when upgrading sku as any custom settings may break at any time. You've been warned!

Example:

```ts
export default {
  dangerouslySetWebpackConfig: (skuWebpackConfig) => ({
    ...skuWebpackConfig,
    someOtherConfig: 'dangerousValue',
  }),
} satisfies SkuConfig;
```

## devServerMiddleware

type `string`

Path to a file in your project that exports a function that can receive the Express server.

This can be used to extend to the dev server middleware.

Example:

```js
module.exports = app => {
  app.get('/mock-api', (req, res) => {
    ...
  })
}
```

## displayNamesProd

type `boolean`

Default: `false`

Adds static `displayName` properties to React components in production. This setting is designed for usage on sites that generate React code snippets, e.g. [Braid](https://seek-oss.github.io/braid-design-system/).

Example:

```ts
export default {
  displayNamesProd: true,
} satisfies SkuConfig;
```

## environments

**Only for static apps**

type `Array<string>`

Default: `[]`

An array of environments the app supports. Apps should have one environment for local development plus one for each environment they're deployed to. Use this value to drive app config (e.g. `analyticsEnabled` or `apiEndpoint`). See [static-rendering](./docs/static-rendering.md) for more info.

## externalizeNodeModules

type `boolean`

Default: `false`

By default, sku compiles all node_modules in builds that target node. Setting this option to `true` will instead externalize all node_modules, excluding `compilePackages`.

## hosts

type `Array<string>`

Default: `['localhost']`

An array of custom hosts the app can be served off when running `sku start`. You must have configured your hosts file to point to localhost as well.

## httpsDevServer

type `boolean`

Default: `false`

Whether or not to use `https` for the local development server with a self-signed certificate. This is useful when testing authentication flows that require access to `window.crypto`.

## initialPath

type `string`

Default: `routes[0].route`

The browser URL to open when running `sku start` or `sku start-ssr`. It will default to the first `route` in the [`routes`](#routes) array.

## languages

type `Array<string | { name: string, extends: string }>`

The languages your application supports.

See [Multi-language support](./docs/multi-language.md) for details.

## libraryEntry

type `string`

**Only for libraries**

The entry file for the library. If set, sku will assume the project is a library. Must export its API from this file.

Example:

```js
export default () => {
  console.log('Hello from my library!');
};
```

## libraryName

type `string`

**Only for libraries**

The global name of the library. Will be added to the `window` object under `window[libraryName]`.

## libraryFile

type `string`

**Only for libraries**

The file name of the library. The main bundle of the library will be output to `dist/${libraryFile}.js` - note that the
`.js` extension will be added automatically and should not be included in the configuration option itself.

If `libraryFile` is not specified then `libraryName` will be used instead.

## persistentCache

type `boolean`

Default: `true`

Disables the use of webpack filesystem caching for `sku start` and `sku start-ssr`.

## polyfills

type `Array<string>`

Default: `[]`

An array of polyfills to be included into all client entry points.

## port

type `number`

Default: `8080`

The port the app is hosted on when running `sku start`.

## public

type `string`

Default: `public`

A folder of public assets to be copied into the `target` directory after `sku build` or `sku build-ssr`.

> Caution: All assets should ideally be imported through the source code to ensure they are named correctly for long term caching. You may run into caching issues using this option. It may be removed in the future.

## publicPath

type `string`

Default: `/`

The URL all the static assets of the app are accessible under.

## renderEntry

type `string`

**Only for static apps and libraries**

Default: `./src/render.js`

The render entry file to the app. This file should export the required functions for static rendering. See [static-rendering](./docs/static-rendering.md) for more info.

## rootResolution

type `boolean`

Default: `true`

Enable root resolution. By default, sku allows importing from the root of the project e.g. `import something from 'src/modules/something'`.

Unfortunately, these kinds of imports only work for apps. In packages, the imports will work locally, but fail when consumed from `node_modules`.

You can set this option in `sku.config.js`, or adding `"skuCompilePackage": true` to your `package.json` will disable this behaviour by default.

## routes

type `Array<string | {route: string, name: string, entry: string, languages: Array<string>}>`

**Only for static apps**

Default: `['/']`

An array of routes for the app. Each route must specify a name and a route corresponding to the path it is hosted under. Each route may also have a custom client entry, which can help with bundle splitting. See [static-rendering](./docs/static-rendering) for more info.

Can be used to limit the languages rendered for a specific route. Any listed language must exist in the [top level languages attribute](./docs/configuration?id=languages).

Example:

```ts
export default {
  routes: ['/', '/details'],
} satisfies SkuConfig;
```

## serverEntry

type `string`

**Only for SSR apps**

Default: `./src/server.js`

The entry file for the server.

## serverPort

type `number`

**Only for SSR apps**

Default: `8181`

The port the server is hosted on when running `sku start-ssr`.

## setupTests

type `string`

Point to a JS file that will run before your tests to setup the testing environment.

## sites

**Only for static apps**

type `Array<string | { name: string, host: string, languages: Array<string>, routes: Array<string> }>`

Default: `[]`

An array of sites the app supports. These usually correspond to each domain the app is hosted under.

Can be an array of site names, or objects with a site name and corresponding host. See [Multi site](./docs/multi-site#switching-site-by-host) for more info.

Can be used to limit the languages rendered for a specific site. Any listed language must exist in the [top level languages attribute](./docs/configuration?id=languages).

## skipPackageCompatibilityCompilation

type `Array<string>`

Default: `[]`

When running `sku build`, sku will compile all your external packages (`node_modules`) through `@babel/preset-env`. This is to ensure external packages satisfy the browser support policy. However, this can cause very slow builds when large packages are processed. The `skipPackageCompatibilityCompilation` option allows you to pass a list of trusted packages to skip this behaviour.

> Note: `react` & `react-dom` are skipped by default.

Example:

```js
const config = {
  skipPackageCompatibilityCompilation: ['@bloat/very-large-package', 'lodash'],
};
```

## sourceMapsProd

type `boolean`

Default: `true`

Source maps are always generated for development builds.
It is recommended to enable source maps for production builds in order to aid debugging.
To disable source maps for production builds, set this option to `false`.

Example:

```ts
export default {
  sourceMapsProd: false,
} satisfies SkuConfig;
```

**NOTE**: Production source maps can increase memory usage during builds to the point where the Node process exhausts its heap memory.
If this occurs, you can increase the memory limit for the Node process by setting the `NODE_OPTIONS` environment variable to `--max-old-space-size=4096` (or a higher value) before running the build command.

For example:

```sh
NODE_OPTIONS=--max-old-space-size=4096 sku build
```

### When to disable `sourceMapsProd`

Production source maps can be expensive.
If your application does not utilize production source maps, e.g. you have no tracking of production errors, you can disable them to potentially reduce build times and memory usage.

## srcPaths

type `Array<string>`

Default: `['./src']`

An array of directories holding your app's source code. By default, sku expects your source code to be in a directory named `src` in the root of your project. Use this option if your source code needs to be arranged differently.

## storybookAddons

type `Array<string>`

Default: `[]`

An array of storybook addons to use.

## storybookPort

type `number`

Default: `8081`

The port to host storybook on when running `sku storybook`.

## storybookStoryStore

type `boolean`

Default: `true`

Allows disabling Storybook's `storyStoreV7` feature flag.
This will result in all stories being loaded upfront instead of on demand.
Disabling this feature will allow stories that use the deprecated `storiesOf` API to work, however it's highly recommended to migrate off `storiesOf` to the Component Story Format (CSF) instead.

## storybookTarget

type `string`

Default: `dist-storybook`

The directory `sku build-storybook` will output files to.

## supportedBrowsers

type `browserslist-query`

Default: [browserslist-config-seek](https://github.com/seek-oss/browserslist-config-seek)

The [`browserslist`](https://github.com/browserslist/browserslist) query describing the app's browser support policy.

## target

type `string`

Default: `dist`

The directory to build your assets into when running `sku build` or `sku build-ssr`

## transformOutputPath

type `function`

**Only for static apps**

Default: `({ environment = '', site = '', route = '' }) => path.join(environment, site, route)`

This function returns the output path within [`target`](#target) for each rendered page. Generally, this value should be sufficient. If you think you need to modify this setting, please reach out to the `sku-support` group first to discuss.
