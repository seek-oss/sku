# Configuration

To configure sku, create a `sku.config.ts` file in your project root:

```sh
$ touch sku.config.ts
```

Sku has a zero-configuration mode.
The equivalent manual configuration looks like this:

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

To use a different config file, pass the `--config` parameter.

```sh
$ sku start --config sku.custom.config.ts
```

> [!NOTE]
> If you pass `--config`, the specified file must exist.
> Sku exits with an error if it cannot find the file.
> Config files can use either TypeScript or JavaScript.

When you omit `--config`, sku searches for config files in this order:

1. `sku.config.ts`
2. `sku.config.js`
3. `sku.config.mjs`

If none of these files exist, sku uses its built-in default configuration.

Config files can use either TypeScript or JavaScript.

## bundler

Type: `'webpack' | 'vite'`

Default: `'webpack'`

The bundler that sku uses to build the application.

`vite` currently supports static apps only.
See [Vite support](./vite) for details.

**Experimental** - Vite supports SSR with experimental Managed Data Mode.
SSR is server-side rendering at request time.
See [SSR](./ssr/).

## buildType

Type: `'ssr' | 'static'`

Default: 'static'

Selects request-time SSR or static generation.

- `'ssr'` for SSR applications. **Experimental — not for production** (see [SSR](./ssr/)).
- `'static'` for Static applications.

## clientEntry

Type: `string`

Default: `./src/client.tsx`

The client entry point to the app.
Path may be `.tsx`, `.ts`, or `.js`.

**Static / Webpack SSR:** the file that runs your browser code.
Each `route` can also specify a client entry.
If none is specified, sku uses `clientEntry`.
See [`routes`](#routes) for more info.

**Static only:** Each `route` can also specify a client entry.
If none is specified, sku uses `clientEntry`.
See [`routes`](#routes) for more info.

## compilePackages

Type: `Array<string>`

Default: `[]`

An array of `node_modules` that sku compiles as if they are part of your source code.
Use this for packages that use CSS Modules or TypeScript and are not pre-compiled.
Use this setting only for internally controlled packages.
Many modules in this array may increase build time.

## cspEnabled

Type: `boolean`

**Unavailable for libraries**

Default: `false`

Enable the content security policy feature.
See [`Content Security Policy`](./csp.md) for more info.

## cspDelivery <Badge type="info" text="Vite Static only" />

Type: `'tag' | 'header'`

Default: `'tag'`

The way the content security policy is delivered.
Only relevant if `cspEnabled` is set to `true`.

## cspExtraScriptSrcHosts

Type: `Array<string>`

Default: `[]`

Extra external hosts to allow in your `script-src` [content security policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP).
Only relevant if `cspEnabled` is set to `true`.

## cspReportTo

Type: `string | [string, string]`

Bundler: `vite`

Where to report content security policy violations.
Only relevant if `cspEnabled` is set to `true` and `cspDelivery` is set to `'header'`.

SSR ignores `cspDelivery`.
SSR always uses HTTP headers.
This option applies whenever `cspEnabled` is `true`.

## cspReportOnlyEnabled

Type: `boolean`

**Unavailable for libraries**

Default: `false`

Bundler: `vite`

Enable the report-only content security policy feature.
See [`Content Security Policy`](./csp.md) for more info.

## cspReportOnlyExtraScriptSrcHosts

Type: `Array<string>`

Default: `cspExtraScriptSrcHosts`

Bundler: `vite`

Extra external hosts to allow in your `script-src` report-only [content security policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP).
Only relevant if `cspReportOnlyEnabled` is set to `true`.

## cspReportOnlyReportTo

Type: `string | [string, string]`

Default: `cspReportTo`

Bundler: `vite`

Where to report report-only content security policy violations.
Only relevant if `cspReportOnlyEnabled` is set to `true`.

## dangerouslySetESLintConfig

Type: `(skuESLintConfig: Linter.Config[]) => Linter.Config[]`

This function lets you modify sku's ESLint configuration.
Use it only in exceptional cases where standard configuration options cannot solve the problem.

Before you modify your ESLint configuration, contact us via the [support page] to discuss your requirements and possible alternatives.

ESLint rules help maintain code quality and consistency.
Some rules can prevent bugs in your code.
React rules are one example.
Do not disable a rule only because it reports frequent errors.
Those errors may be a symptom of a larger problem in your codebase.

If other consumers would benefit from adding, removing, or changing a rule, consider contributing the change to [`eslint-config-seek`](https://github.com/seek-oss/eslint-config-seek).

> [!WARNING]
> Sku does not guarantee that its ESLint configuration will stay compatible with customizations in this function.
> You must keep your customizations compatible with sku.

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

This function lets you modify sku's Jest configuration.
Use it only in exceptional cases where standard configuration options cannot solve the problem.

Check that [`setupTests`] does not already cover your needs before you use this function.

Before you modify your Jest configuration, contact us via the [support page] to discuss your requirements and possible alternatives.

> [!WARNING]
> Sku does not guarantee that its Jest configuration will stay compatible with customizations in this function.
> You must keep your customizations compatible with sku.

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

This function lets you modify sku's TypeScript configuration.
Use it only in exceptional cases where standard configuration options cannot solve the problem.

Before you modify your TypeScript configuration, contact us via the [support page] to discuss your requirements and possible alternatives.

> [!WARNING]
> Sku does not guarantee that its TypeScript configuration will stay compatible with customizations in this function.
> You must keep your customizations compatible with sku.

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

## dangerouslySetViteConfig <Badge type="info" text="Vite Static Only" />

Type: `function`

This function lets you modify sku's Vite configuration.
Use it only in exceptional cases where standard configuration options cannot solve the problem.

**Not supported for SSR**.
If you set `dangerouslySetViteConfig` with SSR, config validation fails.
Contact us via the [support page] with your use case.

Before you modify your Vite configuration, contact us via the [support page] to discuss your requirements and possible alternatives.

Sku creates two Vite configs (`client` and `render`).
This function runs twice.
If you need to modify only one config, check `env.mode` on the second argument.

This function can return a partial config object.
Sku then deep-merges it into the existing config.
That is the recommended path.
You can also mutate the config directly if the default merge cannot produce the result you need.

> [!WARNING]
> Sku does not guarantee that its Vite configuration will stay compatible with customizations in this function.
> You must keep your customizations compatible with sku.

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

This function lets you modify sku's Vitest configuration.
Use it only in exceptional cases where standard configuration options cannot solve the problem.

Before you modify your Vitest configuration, contact us via the [support page] to discuss your requirements and possible alternatives.

> [!WARNING]
> Sku does not guarantee that its Vitest configuration will stay compatible with customizations in this function.
> You must keep your customizations compatible with sku.

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

This function lets you modify sku's Webpack configuration.
Use it only in exceptional cases where standard configuration options cannot solve the problem.

Before you modify your Webpack configuration, contact us via the [support page] to discuss your requirements and possible alternatives.

Sku creates two webpack configs (`client` and `server|render`).
This function runs twice.
If you need to modify only one config, check `config.name`.

> [!WARNING]
> Sku does not guarantee that its Webpack configuration will stay compatible with customizations in this function.
> You must keep your customizations compatible with sku.

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

Path to a file in your project.
The file must export a function that receives the Express server.

You can use this function to extend the dev server middleware.

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

Adds static `displayName` properties to React components in production.
Use this on sites that generate React code snippets. [Braid](https://seek-oss.github.io/braid-design-system/) is one example.

## expressTrustProxy <Badge type="info" text="SSR only" />

Type: `boolean`

Default: `false`

Bundler: `vite` · `buildType: 'ssr'`

When `true`, sku sets Express `app.set('trust proxy', 1)` before listen.
That value is hop count **`1`**, not Express boolean `true`.
Use this for a single reverse proxy.

If you omit the option or set `false`, Express keeps its default (`false`).
This option is off unless you set it in config.
Sku does not set it as a silent default.
The create `ssr` template sets `expressTrustProxy: true`.

For any other trust-proxy value (`false`, `2`, an IP list, …), override it in server-entry [`onListen`](./ssr/entries.md#onlisten) with `app.set('trust proxy', …)`.

```ts
export default {
  bundler: 'vite',
  buildType: 'ssr',
  expressTrustProxy: true,
} satisfies SkuConfig;
```

Example:

```ts
export default {
  displayNamesProd: true,
} satisfies SkuConfig;
```

## environments <Badge type="info" text="Static only" />

Type: `Array<string>`

Default: `[]`

An array of environments the app supports.
Include one environment for local development.
Include one environment for each deployment target.
Use this value to drive app config.
Examples include `analyticsEnabled` and `apiEndpoint`.
See [static-rendering](./static-rendering.md) for more info.

## externalizeNodeModules

Type: `boolean`

Default: `false`

By default, sku compiles all `node_modules` in builds that target Node.
Set this option to `true` to externalize all `node_modules` except `compilePackages`.

## eslintIgnore

Type: `Array<string>`

Default: `[]`

When sku runs ESLint, it ignores [a number of files and directories][default ignores] by default.
Use this option to ignore extra files and directories.

[default ignores]: ./linting

## hosts

Type: `Array<string>`

Default: `['localhost']`

An array of custom hosts that can serve the app when you run `sku start` or `sku start-ssr`.

We recommend hostnames that end in `.localhost`. `au.seek.com.localhost` is one example.
These hostnames usually resolve to your machine automatically.
Sku does not warn when they are missing from your [hosts file](https://en.wikipedia.org/wiki/Hosts_%28file%29).
Exact `localhost` is also exempt from that warning.

For other custom hosts, your hosts file must point them to `localhost`.
You can do this automatically by running [`sudo sku setup-hosts`](./cli.md#setup-hosts). `setup-hosts` still writes `.localhost` entries if you run it.

## httpsDevServer

Type: `boolean`

Default: `false`

Whether to use `https` for the local development server with a self-signed certificate.
Use this when you test authentication flows that need `window.crypto`.
It also remains available for Safari and similar environments that still need a secure context over HTTPS, even with `*.localhost` hostnames.

Supported for Static, webpack, and SSR via `sku start`.

## initialPath

Type: `string`

Default: `routes[0].route`

The browser URL to open when you run `sku start` or `sku start-ssr`.
The default is the first `route` in the [`routes`](#routes) array.

## languages

Type: `Array<string | { name: string, extends: string }>`

The languages your application supports.

See [Multi-language support](./multi-language.md) for details.

## libraryEntry <Badge type="info" text="Library-mode only" />

Type: `string`

The entry file for the library.
If you set this option, sku treats the project as a library.
The file must export the library API.

Example:

```js
export default () => {
  console.log('Hello from my library!');
};
```

## libraryName <Badge type="info" text="Library-mode only" />

Type: `string`

The global name of the library.
Sku adds it to the `window` object as `window[libraryName]`.

## libraryFile <Badge type="info" text="Library-mode only" />

Type: `string`

The file name of the library.
Sku writes the main bundle to `dist/${libraryFile}.js`.
Sku adds the `.js` extension automatically.
Do not include `.js` in this option.

If you omit `libraryFile`, sku uses `libraryName` instead.

## pathAliases

Type: `Record<string, string>`

Default: `{}`

Custom path alias mappings for module resolution.
Each alias pattern maps to a destination path relative to the project root.

This option generates `tsconfig.json#paths` so TypeScript can resolve these imports.
Sku also writes the same mappings to your `package.json#imports` field so the aliases resolve natively at build time.

Prefix subpath import specifiers with `#`.

> [!WARNING]
> Sku fully manages the `imports` field.
> Sku removes any entries you add by hand.
> Declare all of your subpath imports via `pathAliases` instead.

**Example:**

```ts
export default {
  pathAliases: {
    '#components/*': './src/components/*', // [!code highlight]
    '#utils/*': './src/utils/*', // [!code highlight]
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

You can then write imports like:

```ts
import { Button } from '#components/Button';
import { formatDate } from '#utils/date';
```

**Best practices:**

- Prefer a well-structured `src/` directory over many path aliases
- For complex projects that need more organization, consider a monorepo instead of many path aliases
- Path aliases cannot point to `node_modules` directories

## entrySideEffects <Badge type="info" text="Vite only" />

Type: `Array<string>`

Default: `[]`

Bundler: `vite`

An array of isomorphic modules that sku imports before any consumer module on Vite static and Vite SSR graphs.
Isomorphic modules run on both the browser and the Node server.

Use this for CSS resets and other side effects that must run first on both the browser and the Node server.
Specifiers resolve from your app, in array order.

Do not put `window`-only code here.
Use [`polyfills`](#polyfills) for browser-only globals.

```ts
import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  entrySideEffects: ['braid-design-system/reset'],
} satisfies SkuConfig;
```

## polyfills

Type: `Array<string>`

Default: `[]`

An array of polyfills to include in all client entry points.

These load in the browser only.
For isomorphic first-on-the-graph modules such as Braid reset, use [`entrySideEffects`](#entrysideeffects).

## port

Type: `number`

Default: `8080`

The port that hosts the app when you run `sku start`.

**SSR**: this is also the baked production default listen port (`node dist/server/server.js`).
Override it at runtime with `PORT`.
SSR does not use [`serverPort`](#serverport).

## public

Type: `string`

Default: `'public'`

A folder of public assets.
Sku copies it into the `target` directory after `sku build` or `sku build-ssr`.

**Not supported for SSR**

## publicPath

Type: `string`

Default: `'/'`

The URL that serves all static assets of the app.

For SSR, `publicPath` must be relative.
Examples: `/` or `/static/`.
Absolute `http(s)` and CDN URLs are not supported.

For SSR, `publicPath` applies to `sku build` and production. `sku start` serves the Vite module graph from `/`.

## renderEntry <Badge type="info" text="Library and Static only" />

Type: `string`

Default: `./src/render.js`

The render entry file for the app.
This file must export the functions that static rendering needs.
See [static-rendering](./static-rendering.md) for more info.

## routes <Badge type="info" text="Static only" />

Type: `Array<string | {route: string, name: string, entry: string, languages: Array<string>}>`

Default: `['/']`

An array of routes for the app.
You can pass path strings, or objects with a name and a route for the path.
Each route may also have a custom client entry.
A custom client entry can help with bundle splitting.
See [static-rendering](./static-rendering) for more info.

You can also limit the languages rendered for a specific route.
Any listed language must exist in the [top level languages attribute](#languages).

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

Default-export a `defineServerEntry` object.
Optional getters are `getSite`, `getLanguage`, `getClientContext`, `getReactContext`, and `getRouterContext`. `middleware` is also optional.
`getSite` is required only when config [`sites`](#sites) has more than one entry.
Routes live on [`routesEntry`](#routesentry), not here.

See [Request entries](./ssr/entries.md).

## routesEntry <Badge type="info" text="SSR only" />

Type: `string`

Default: `./src/routes.tsx`

Path may be `.tsx`, `.ts`, or `.js`.

Module that exports named `routes` (`SkuRouteObject[]`) for both the server and client graphs.

See [Routing](./ssr/routing.md).

## serverPort <Badge type="info" text="Webpack SSR only" />

Type: `number`

Bundler: `webpack`

Default: `8181`

The port that hosts the server when you run `sku start-ssr`.
This is also the default listen port for the webpack production server.

## setupTests

Type: `string`

Point to a JS file that runs before your tests to configure the testing environment.

## sites

Type: `Array<string | { name: string, host: string, languages: Array<string>, routes: Array<string> }>`

Default: `[]`

An array of sites the app supports.
These usually match each domain that hosts the app.

You can pass an array of site names, or objects with a site name and a host.
See [Multi site](./multi-site#switching-site-by-host) for more info.

**Static apps**

You can also limit the languages rendered for a specific site.
Any listed language must exist in the [top level languages attribute](#languages).

`sites[].host` and [`hosts`](#hosts) are for local-dev listen and setup-hosts only.
They do not select the route tree.
See [Routing → Multi-site](./ssr/routing.md#multi-site-routes).

## skipPackageCompatibilityCompilation

Type: `Array<string>`

Default: `[]`

When you run `sku build`, sku compiles all your external packages (`node_modules`) through `@babel/preset-env`.
Sku does this so external packages satisfy the browser support policy.
Large packages can make this step very slow.
Pass a list of trusted packages to `skipPackageCompatibilityCompilation` to skip this behaviour.

> [!NOTE]
> `react` and `react-dom` are skipped by default.

Example:

```js
const config = {
  skipPackageCompatibilityCompilation: ['@bloat/very-large-package', 'lodash'],
};
```

## sourceMapsProd

Type: `boolean`

Default: `true`

Sku always generates source maps for development builds.
Keep source maps enabled for production builds so you can debug production.
To disable source maps for production builds, set this option to `false`.

Example:

```ts
export default {
  sourceMapsProd: false,
} satisfies SkuConfig;
```

> [!WARNING]
> Production source maps can increase memory usage during builds.
> The Node process may exhaust its heap memory.
> If this occurs, increase the memory limit for the Node process.
> Set the `NODE_OPTIONS` environment variable to `--max-old-space-size=4096` (or a higher value) before you run the build command.

For example:

```sh
NODE_OPTIONS=--max-old-space-size=4096 sku build
```

### When to disable `sourceMapsProd`

Production source maps can use a lot of memory and time.
If your app does not use production source maps, you can disable them.
For example, you have no tracking of production errors.
Disabling them may reduce build times and memory usage.

## srcPaths

Type: `Array<string>`

Default: `['./src']`

Bundler: `webpack`

An array of directories that hold your app's source code.
By default, sku expects source code in a `src` directory at the project root.
Use this option if you arrange source code differently.

## supportedBrowsers

Type: `Array<string>`

Default: [browserslist-config-seek](https://github.com/seek-oss/browserslist-config-seek)

The [`browserslist`](https://github.com/browserslist/browserslist) query describing the app's browser support policy.

## target

Type: `string`

Default: `dist`

The directory that receives your assets when you run `sku build` or `sku build-ssr`

## testRunner

Type: `'jest' | 'vitest'`

Default: `'jest'`

The test runner that sku uses to run the tests.

## transformOutputPath <Badge type="info" text="Static only" />

Type: `function`

Default: `({ environment = '', site = '', route = '' }) => path.join(environment, site, route)`

This function returns the output path within [`target`](#target) for each rendered page.
The default is usually enough.
If you think you need to change this setting, contact us via the [support page] first.

[support page]: /support

## vitePlugins

Type: `PluginOption[]`

Default: `[]`

Bundler: `vite`

Adds extra Vite plugins to the Vite config.

**Not supported for SSR**.
If you set `vitePlugins` with SSR, config validation fails.
Contact us via the [support page] with your use case.

## \_\_UNSAFE_EXPERIMENTAL\_\_cjsInteropDependencies <Badge type="info" text="Vite only" />

Type: `string[]`

Default: `[]`

Bundler: `vite`

> [!WARNING]
> This is an experimental option.
> It may change or be removed without notice.

An array of CJS import paths that have both a default export and named exports.

Sku uses this list to enable CommonJS interop for these dependencies when the bundler is `vite`.

Packages that resolve to a module namespace object under `sku start` often need an entry here.
The React error is “Element type is invalid … got: object”.
See [Server rendering → CJS default-export interop](./ssr/troubleshooting.md#cjs-default-export-interop).

See https://github.com/cyco130/vite-plugin-cjs-interop for more information.
