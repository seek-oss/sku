# Configuration

If you need to configure sku, first create a `sku.config.ts` file in your project root:

```sh
$ touch sku.config.ts
```

While sku has a zero configuration mode, the equivalent manual configuration would look like this:

```ts
import type { SkuConfig } from 'sku';

export default {
  clientEntry: 'src/client.tsx',
  renderEntry: 'src/render.tsx',
  public: 'src/public',
  publicPath: '/',
  target: 'dist',
} satisfies SkuConfig;
```

If you need to specify a different config file you can do so with the `--config` parameter.

```sh
$ sku start --config sku.custom.config.ts
```

> When using the `--config` parameter, the specified file must exist. Sku will exit with an error if the file cannot be found.
> Config files can use either TypeScript or JavaScript.

When **no** `--config` parameter is provided, sku will automatically look for config files in this order:

1. `sku.config.ts`
2. `sku.config.js`
3. `sku.config.mjs`

If none of these files exist, sku will use its built-in default configuration.

Config files can use either TypeScript or JavaScript.

## bundler

Type: `webpack | vite`

Default: `webpack`

The bundler that sku uses to build the application.

Vite supports static or server-rendered apps via `buildType: 'ssr'`.
See [Vite support](./vite) for details.

## buildType

Type: `'ssr' | 'static'`

Default: 'static'

Selects request-time SSR or static generation.

- `'ssr'` for SSR applications. **Experimental — not for production** (see [Server rendering](./ssr/)).
- `'static'` for Static applications.

See [Server rendering](./ssr/).

## clientEntry

Type: `string`

Default: `./src/client.tsx`

The client entry point to the app. Path may be `.tsx`, `.ts`, or `.js`.

**Static / Webpack:** the file that executes your browser code. Each `route` can also specify a client entry; if none is specified the `clientEntry` is used. See [`routes`](#routes) for more info.

**SSR:** required client entry exporting named `routes` (`RouteObject[]`) and `onHydrate`. Missing file or named export is a hard error. Prefer a shared `createRoutes(...)` factory with the server entry so trees stay hydration-compatible. See [Request entries](./ssr/entries.md).

## compilePackages

Type: `Array<string>`

Default: `[]`

An array of `node_modules` to be compiled as if they were part of your source code. This allows the use of packages that make use of CSS Modules or TypeScript without having them be pre compiled. Ideally, this setting should only be used for internally controlled packages. Many modules added to this array may affect build time.

## cspEnabled

Type: `boolean`

**Unavailable for libraries**

Default: `false`

Enable content security policy feature. See [`Content Security Policy`](./csp.md) for more info.

## cspDelivery <Badge type="info" text="Vite Static only" />

Type: `'tag' | 'header'`

Default: `'tag'`

The way the content security policy is delivered. Only relevant if `cspEnabled` is set to `true`.

## cspExtraScriptSrcHosts

Type: `Array<string>`

Default: `[]`

Extra external hosts to allow in your `script-src` [content security policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP). Only relevant if `cspEnabled` is set to `true`.

## cspReportOnlyEnabled

Type: `boolean`

**Unavailable for libraries**

Default: `false`

Bundler: `vite`

Enable report-only content security policy feature. See [`Content Security Policy`](./csp.md) for more info.

## cspReportOnlyExtraScriptSrcHosts <Badge type="info" text="Vite only" />

Type: `Array<string>`

Default: `cspExtraScriptSrcHosts`

Extra external hosts to allow in your `script-src` report-only [content security policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP). Only relevant if `cspReportOnlyEnabled` is set to `true`.

## cspReportOnlyReportTo <Badge type="info" text="SSR only" />

Type: `string`

Default: `undefined`

CSP [`report-to`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/report-to) group name token for the Report-Only policy. Only relevant if `cspReportOnlyEnabled` is `true`. When set, sku appends `report-to <value>` to `Content-Security-Policy-Report-Only`.

sku does not emit a `Reporting-Endpoints` (or legacy `Report-To`) header — define the matching endpoint group in your app or infrastructure.

## dangerouslySetESLintConfig

Type: `function`

This function provides a way to modify sku's ESLint configuration.
It should only be used in exceptional circumstances where a solution cannot be achieved by adjusting standard configuration options.

Before customizing your ESLint configuration, please reach out via the [support page] to discuss your requirements and potential alternative solutions.

ESLint rules help to maintain code quality and consistency.
Some rules even prevent potential bugs in your code, e.g. React rules.
Rather than disabling a rule purely because it causes frequent errors, consider whether these errors may be a symptom of a larger problem in your codebase.

If you believe other consumers would benefit from the addition/removal/modificaton of a rule, consider contributing the change to [`eslint-config-seek`](https://github.com/seek-oss/eslint-config-seek).

> Sku provides no guarantees that its ESLint configuration will remain compatible with any customizations made within this function.
> It is the responsibility of the user to ensure that their customizations are compatible with sku.

Example:

```ts
import customPlugin from 'custom-eslint-plugin';

export default {
  dangerouslySetESLintConfig: (skuEslintConfig) => [
    ...skuEslintConfig,
    {
      plugins: {
        customPlugin,
      },
      rules: {
        'customPlugin/rule1': 'warn',
      },
    },
  ],
} satisfies SkuConfig;
```

## dangerouslySetJestConfig

Type: `function`

This function provides a way to modify sku's Jest configuration.
It should only be used in exceptional circumstances where a solution cannot be achieved by adjusting standard configuration options.

Make sure [`setupTests`] definitely doesn’t cover your needs before using.

Before customizing your Jest configuration, please reach out via the [support page] to discuss your requirements and potential alternative solutions.

> Sku provides no guarantees that its Jest configuration will remain compatible with any customizations made within this function.
> It is the responsibility of the user to ensure that their customizations are compatible with sku.

Example:

```ts
export default {
  dangerouslySetJestConfig: (skuJestConfig) => ({
    ...skuJestConfig,
    someOtherConfig: 'dangerousValue',
  }),
} satisfies SkuConfig;
```

[`setupTests`]: #setupTests

## dangerouslySetTSConfig

Type: `function`

This function provides a way to modify sku's TypeScript configuration.
It should only be used in exceptional circumstances where a solution cannot be achieved by adjusting standard configuration options.

Before customizing your TypeScript configuration, please reach out via the [support page] to discuss your requirements and potential alternative solutions.

> Sku provides no guarantees that its TypeScript configuration will remain compatible with any customizations made within this function.
> It is the responsibility of the user to ensure that their customizations are compatible with sku.

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

## dangerouslySetViteConfig <Badge type="info" text="Vite only" />

Type: `function`

This function provides a way to modify sku's Vite configuration.
It should only be used in exceptional circumstances where a solution cannot be achieved by adjusting standard configuration options.

**Not supported for SSR** (`buildType: 'ssr'`). Providing `dangerouslySetViteConfig` with SSR fails config validation. Raise exceptional customisation needs via the [support page] with your use-case.

Before customizing your Vite configuration, please reach out via the [support page] to discuss your requirements and potential alternative solutions.

As sku creates two Vite configs (`client` & `render`), this function will actually run twice.
If you only need to modify one of these configs, then you can check `env.mode` from the second argument within.

This function can return a partial config object that will be deeply merged into existing config (recommended), or directly mutate the config (if the default merging cannot achieve the desired result).

> Sku provides no guarantees that its Vite configuration will remain compatible with any customizations made within this function.
> It is the responsibility of the user to ensure that their customizations are compatible with sku.

Example:

```ts
export default {
  // partial config is deeply merged
  dangerouslySetViteConfig: (_config, _env) => ({
    resolve: {
      alias: {
        foo: 'bar',
      },
    },
  }),
} satisfies SkuConfig;
```

## dangerouslySetVitestConfig

Type: `function`

This function provides a way to modify sku's Vitest configuration.
It should only be used in exceptional circumstances where a solution cannot be achieved by adjusting standard configuration options.

Before customizing your Vitest configuration, please reach out via the [support page] to discuss your requirements and potential alternative solutions.

> Sku provides no guarantees that its Vitest configuration will remain compatible with any customizations made within this function.
> It is the responsibility of the user to ensure that their customizations are compatible with sku.

Example:

```ts
export default {
  dangerouslySetVitestConfig: (config) => ({
    ...config,
    clearMocks: true,
  }),
} satisfies SkuConfig;
```

## dangerouslySetWebpackConfig <Badge type="info" text="Webpack only" />

Type: `function`

This function provides a way to modify sku's Webpack configuration.
It should only be used in exceptional circumstances where a solution cannot be achieved by adjusting standard configuration options.

Before customizing your Webpack configuration, please reach out via the [support page] to discuss your requirements and potential alternative solutions.

As sku creates two webpack configs (`client` & `server|render`), this function will actually run twice.
If you only need to modify one of these configs, then you can check `config.name`.

> Sku provides no guarantees that its Webpack configuration will remain compatible with any customizations made within this function.
> It is the responsibility of the user to ensure that their customizations are compatible with sku.

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

Type: `string`

Path to a file in your project that exports a function that can receive the Express server.

This can be used to extend to the dev server middleware.

Example:

```js
export default (app) => {
  app.get('/mock-api', (req, res) => {
    // ...
  });
};
```

## displayNamesProd

Type: `boolean`

Default: `false`

Adds static `displayName` properties to React components in production. This setting is designed for usage on sites that generate React code snippets, e.g. [Braid](https://seek-oss.github.io/braid-design-system/).

Example:

```ts
export default {
  displayNamesProd: true,
} satisfies SkuConfig;
```

## environments <Badge type="info" text="Static only" />

Type: `Array<string>`

Default: `[]`

An array of environments the app supports. Apps should have one environment for local development plus one for each environment they're deployed to. Use this value to drive app config (e.g. `analyticsEnabled` or `apiEndpoint`). See [static-rendering](./static-rendering.md) for more info.

## externalizeNodeModules

Type: `boolean`

Default: `false`

By default, sku compiles all node_modules in builds that target node. Setting this option to `true` will instead externalize all node_modules, excluding `compilePackages`.

## eslintIgnore

Type: `Array<string>`

Default: `[]`

Sku ignores [a number of files and directories][default ignores] by default when running ESLint.
This option allows you to add additional files and directories to be ignored.

[default ignores]: ./linting

## hosts

Type: `Array<string>`

Default: `['localhost']`

An array of custom hosts the app can be served off when running `sku start` or `sku start-ssr`.
Your [hosts file](https://en.wikipedia.org/wiki/Hosts_%28file%29) must be configured to point these hosts to `localhost`.
This can be done automatically by running [`sudo sku setup-hosts`](./cli.md#setup-hosts).

## httpsDevServer

Type: `boolean`

Default: `false`

Whether or not to use `https` for the local development server with a self-signed certificate. This is useful when testing authentication flows that require access to `window.crypto`.

Supported for Static, webpack, and SSR (`buildType: 'ssr'`) via `sku start`.

## initialPath

Type: `string`

Default: `routes[0].route`

The browser URL to open when running `sku start` or `sku start-ssr`. It will default to the first `route` in the [`routes`](#routes) array.

## languages

Type: `Array<string | { name: string, extends: string }>`

The languages your application supports.

See [Multi-language support](./multi-language.md) for details.

## libraryEntry <Badge type="info" text="Library-mode only" />

Type: `string`

The entry file for the library. If set, sku will assume the project is a library. Must export its API from this file.

Example:

```js
export default () => {
  console.log('Hello from my library!');
};
```

## libraryName <Badge type="info" text="Library-mode only" />

Type: `string`

The global name of the library. Will be added to the `window` object under `window[libraryName]`.

## libraryFile <Badge type="info" text="Library-mode only" />

Type: `string`

The file name of the library. The main bundle of the library will be output to `dist/${libraryFile}.js` - note that the
`.js` extension will be added automatically and should not be included in the configuration option itself.

If `libraryFile` is not specified then `libraryName` will be used instead.

## pathAliases

Type: `Record<string, string>`

Default: `{}`

Custom path alias mappings for module resolution. Each alias pattern maps to a destination path relative to the project root.

This option generates `tsconfig.json#paths` so TypeScript can resolve these imports, and `sku` mirrors it into your `package.json#imports` field so the aliases resolve natively at build time.

Subpath import specifiers must be prefixed with `#`.

> [!WARNING]
> Because `sku` fully manages the `imports` field, any entries you add manually will be removed.
> Declare all of your subpath imports via `pathAliases` instead.

**Example:**

`sku.config.ts`:

```typescript
export default {
  pathAliases: {
    '#components/*': './src/components/*',
    '#utils/*': './src/utils/*',
  },
} satisfies SkuConfig;
```

`sku` writes the matching `imports` field to your `package.json`:

```json
{
  "imports": {
    "#components/*": "./src/components/*",
    "#utils/*": "./src/utils/*"
  }
}
```

This enables clean imports like:

```typescript
import { Button } from '#components/Button';
import { formatDate } from '#utils/date';
```

**Best practices:**

- Prefer organizing code within a well-structured `src/` directory over extensive path aliasing
- For complex projects requiring high levels of code organization, consider using a monorepo structure instead of relying heavily on path aliases
- Path aliases cannot point to `node_modules` directories

## polyfills

Type: `Array<string>`

Default: `[]`

An array of polyfills to be included into all client entry points.

## port

Type: `number`

Default: `8080`

The port the app is hosted on when running `sku start`.

**SSR** (`buildType: 'ssr'`): also the baked production default listen port (`node dist/server/server.js`). Override at runtime with `PORT`. SSR does not use [`serverPort`](#serverport).

## public

Type: `string`

Default: `public`

A folder of public assets to be copied into the `target` directory after `sku build` or `sku build-ssr`.

**Not supported for Vite SSR**

## publicPath

Type: `string`

Default: `/`

The URL all the static assets of the app are accessible under.

For SSR (`buildType: 'ssr'`) the `publicPath` must be relative (e.g. `/` or `/static/`). Absolute `http(s)` / CDN URLs are not supported.

For SSR, `publicPath` applies to `sku build` / production. `sku start` serves the Vite module graph from `/`.

## renderEntry <Badge type="info" text="Library and Static only" />

Type: `string`

Default: `./src/render.js`

The render entry file to the app. This file should export the required functions for static rendering. See [static-rendering](./static-rendering.md) for more info.

## routes <Badge type="info" text="Static only" />

Type: `Array<string | {route: string, name: string, entry: string, languages: Array<string>}>`

Default: `['/']`

An array of routes for the app. Each route must specify a name and a route corresponding to the path it is hosted under. Each route may also have a custom client entry, which can help with bundle splitting. See [static-rendering](./static-rendering) for more info.

Can be used to limit the languages rendered for a specific route. Any listed language must exist in the [top level languages attribute](#languages).

Example:

```ts
export default {
  routes: ['/', '/details'],
} satisfies SkuConfig;
```

## serverEntry <Badge type="info" text="SSR only" />

Type: `string`

Default: `./src/server.tsx`

Path may be `.tsx`, `.ts`, or `.js`.

See [Request entries](./ssr/entries.md).

## serverPort <Badge type="info" text="Webpack SSR only" />

Type: `number`

Bundler: `webpack`

Default: `8181`

The port the server is hosted on when running `sku start-ssr`, and the default listen port for the webpack production server.

## setupTests

Type: `string`

Point to a JS file that will run before your tests to setup the testing environment.

## sites

Type: `Array<string | { name: string, host: string, languages: Array<string>, routes: Array<string> }>`

Default: `[]`

An array of sites the app supports.
These usually correspond to each domain the app is hosted under.

Can be an array of site names, or objects with a site name and corresponding host.
See [Multi site](./multi-site#switching-site-by-host) for more info.

**Static apps**

Can be used to limit the languages rendered for a specific site.
Any listed language must exist in the [top level languages attribute](#languages).

**SSR apps**

Only affects which hosts the development server responds to.
For simplicitly, it's recommended to configure [`hosts`](#hosts) instead.

## skipPackageCompatibilityCompilation

Type: `Array<string>`

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

Type: `boolean`

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

Type: `Array<string>`

Default: `['./src']`

Bundler: `webpack`

An array of directories holding your app's source code. By default, sku expects your source code to be in a directory named `src` in the root of your project. Use this option if your source code needs to be arranged differently.

## supportedBrowsers

Type: `browserslist-query`

Default: [browserslist-config-seek](https://github.com/seek-oss/browserslist-config-seek)

The [`browserslist`](https://github.com/browserslist/browserslist) query describing the app's browser support policy.

## target

Type: `string`

Default: `dist`

The directory to build your assets into when running `sku build` or `sku build-ssr`

## testRunner

Type: `jest | vitest`

Default: `jest`

The test runner that sku uses to run the tests.

## transformOutputPath <Badge type="info" text="Static only" />

Type: `function`

Default: `({ environment = '', site = '', route = '' }) => path.join(environment, site, route)`

This function returns the output path within [`target`](#target) for each rendered page. Generally, this value should be sufficient. If you think you need to modify this setting, please reach out via the [support page] first to discuss.

[support page]: /support

## vitePlugins

Type: `PluginOption[]`

Default: `[]`

Bundler: `vite`

Provides a way to add additional Vite plugins to the Vite config.

## \_\_UNSAFE_EXPERIMENTAL\_\_cjsInteropDependencies <Badge type="info" text="Vite only" />

Type: `string[]`

Default: `[]`

_This is an experimental option that may change or be removed without notice._

An array of cjs import paths that have both a default and named exports.

This is used to enable CommonJS interop for these dependencies when using the `vite` bundler.

For SSR, packages that resolve to a module namespace object under `sku start` (React error “Element type is invalid … got: object”) often need an entry here — see [Server rendering → CJS default-export interop](./ssr/troubleshooting.md#cjs-default-export-interop). Sku already includes Apollo Client in its baked defaults; do not rely on sku expanding that list for other offenders.

See https://github.com/cyco130/vite-plugin-cjs-interop for more information.
