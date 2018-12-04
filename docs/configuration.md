# Configuration

- [Configuration](#configuration)
  - [`clientEntry` [`string`]](#cliententry-string)
  - [`renderEntry` [`string`]](#renderentry-string)
  - [`serverEntry` [`string`]](#serverentry-string)
  - [`libraryEntry` [`string`]](#libraryentry-string)
  - [`routes` [`Array<{ name: string, route: string, entry?: string }>`]](#routes-array-name-string-route-string-entry-string-)
  - [`sites` [`Array<string>`]](#sites-arraystring)
  - [`environments` [`Array<string>`]](#environments-arraystring)
  - [`transformOutputPath` [`function`]](#transformoutputpath-function)
  - [`devTransformOutputPath` [`string`]](#devtransformoutputpath-string)
  - [`srcPaths` [`Array<string>`]](#srcpaths-arraystring)
  - [`compilePackages` [`Array<string>`]](#compilepackages-arraystring)
  - [`hosts` [`Array<string>`]](#hosts-arraystring)
  - [`port` [`number`]](#port-number)
  - [`serverPort` [`number`]](#serverport-number)
  - [`target` [`string`]](#target-string)
  - [`setupTests` [`string`]](#setuptests-string)
  - [`storybookPort` [`number`]](#storybookport-number)
  - [`initialPath` [`string`]](#initialpath-string)
  - [`public` [`string`]](#public-string)
  - [`publicPath` [`string`]](#publicpath-string)
  - [`polyfills` [`Array<string>`]](#polyfills-arraystring)
  - [`libraryName` [`string`]](#libraryname-string)
  - [`supportedBrowsers` [`browserslist-query`]](#supportedbrowsers-browserslist-query)
  - [`dangerouslySetWebpackConfig` [`function`]](#dangerouslysetwebpackconfig-function)
  - [`dangerouslySetJestConfig` [`function`]](#dangerouslysetjestconfig-function)
  - [`dangerouslySetESLintConfig` [`function`]](#dangerouslyseteslintconfig-function)

## `clientEntry` [`string`]

Default: `./src/client.js`

The client entry point to the app. The client entry is the file that executes your browser code.

Each `route` can also specify a client entry, if none is specified the `clientEntry` is used. See [`routes`](#routes-array-name-string-route-string-entry-string-) for more info.

## `renderEntry` [`string`]

**Only for static apps and libraries**

Default: `./src/render.js`

The render entry file to the app. This file should export the required functions for static rendering. See [static-rendering](./static-rendering.md) for more info.

## `serverEntry` [`string`]

**Only for SSR apps**

Default: `./src/server.js`

The entry file for the server.

## `libraryEntry` [`string`]

**Only for libraries**

The entry file for the library. If set, sku will assume the project is a library. Must export its API from this file.

Example:

```js
export default () => {
  console.log('Hello from my library!');
};
```

## `routes` [`Array<{ name: string, route: string, entry?: string }>`]

**Only for static apps**

Default: `[{ name: 'default', route: '/' }]`

An array of routes for the app. Each route must specify a name and a route corresponding to the path it is hosted under. Each route may also have a custom client entry, which can help with bundle splitting. See [static-rendering](./static-rendering.md) for more info.

Example:

```js
{
  routes: [{ name: 'home', route: '/' }];
}
```

## `sites` [`Array<string>`]

Default: `[]`

An array of sites the app supports. These usually correspond to each domain the app is hosted under. See [static-rendering](./static-rendering.md) for more info.

## `environments` [`Array<string>`]

Default: `[]`

An array of environments the app supports. Apps should have one environment for local development plus one for each environment they're deployed to. Use this value to drive app config (e.g. `analyticsEnabled` or `apiEndpoint`). See [static-rendering](./static-rendering.md) for more info.

## `transformOutputPath` [`function`]

**Only for static apps**

Default: `({ environment = '', site = '', route = '' }) => path.join(environment, site, route)`

This function returns the output path within [`target`](#target-string) for each rendered page. Generally, this value should be sufficient. If you think you need to modify this setting, please reach out to the `sku-support` group first to discuss.

## `devTransformOutputPath` [`string`]

**Only for libraries**

Default: `({ route }) => route`

Same as `transformOutputPath` but used when running `sku start`.

## `srcPaths` [`Array<string>`]

Default: `['./src']`

An array of directories holding your apps source code.

## `compilePackages` [`Array<string>`]

Default: `[]`

An array of `node_modules` to be compiled as if they were part of your source code. This allows the use of packages that make use of CSS Modules or TypeScript without having them be pre compiled. Ideally, this setting should only be used for internally controlled packages.

## `hosts` [`Array<string>`]

Default: `['localhost']`

An array of custom hosts the app can be served off when running `sku start`. You must have configured your hosts file to point to localhost as well.

## `port` [`number`]

Default: `8080`

The port the app is hosted on when running `sku start`.

## `serverPort` [`number`]

**Only for SSR apps**

Default: `8181`

The port the server is hosted on when running `sku start-ssr`.

## `target` [`string`]

Default: `dist`

The directory to build your assets into when running `sku build` or `sku build:ssr`

## `setupTests` [`string`]

Point to a JS file that will run before your tests to setup the testing environment.

## `storybookPort` [`number`]

Default: `8081`

The port to host storybook on when running `sku storybook`.

## `initialPath` [`string`]

Default: `routes[0].route`

The browser URL to open when running `sku start` or `sku start-ssr`. It will default to the first `route` in the [`routes`](#routes-array-name-string-route-string-entry-string-) array.

## `public` [`string`]

Default: `public`

A folder of public assets to be copied into the `target` directory after `sku build` or `sku build-ssr`.

> Caution: All assets should ideally be imported through the source code to ensure they are named correctly for long term caching. You may run into caching issues using this option. It may be removed in future.

## `publicPath` [`string`]

Default: `/`

The URL all the static assets of the app are accessible under.

## `polyfills` [`Array<string>`]

Default: `[]`

An array of polyfills to be included into all client entry points.

## `libraryName` [`string`]

**Only for libraries**

The global name of the library. Will be added to the `window` object under `window[libraryName]`.

## `supportedBrowsers` [`browserslist-query`]

Default: [browserslist-config-seek](https://github.com/seek-oss/browserslist-config-seek)

The [`browserslist`](https://github.com/browserslist/browserslist) query describing the apps browser support policy.

## `dangerouslySetWebpackConfig` [`function`]

This function provides a way to override the webpack config after sku has created it. Ideally, this is not needed and only used for experimenting/debugging. If you require webpack features not currently supported by sku please speak to the `sku-support` group.

Reliance on this setting will cause issues when upgrading sku as any custom settings may break at anytime. You've been warned!

## `dangerouslySetJestConfig` [`function`]

Similar to `dangerouslySetWebpackConfig` but for [jest](https://jestjs.io/docs/en/configuration) config. Make sure [`setupTests`](#setuptests-string) definitely doesn't cover your needs before using.

Please speak with the `sku-support` group before using.

## `dangerouslySetESLintConfig` [`function`]

Similar to `dangerouslySetWebpackConfig` but for [eslint](https://eslint.org/) config.
