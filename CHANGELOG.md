# sku

## 10.9.5

### Patch Changes

- Upgrade to v0.0.9 Vocab supporting direct usage ([#571](https://github.com/seek-oss/sku/pull/571))

- Replace all instances of \$language in a route not just the first ([#572](https://github.com/seek-oss/sku/pull/572))

- Replace \$language in route when using dev server ([#572](https://github.com/seek-oss/sku/pull/572))

  When implementing `renderApp` for statically rendered applications previously `route` could contain `$language` inside the URL.

  Now `route` will have any `$language` value replaced with the current language being rendered.

  ```ts
  const skuRender: Render<RenderContext> = {
    renderApp: ({ SkuProvider, route, language }) => {
      // e.g. language === "en"

      // previous behaviour
      // route === "/$language/home"

      // new behaviour
      // route === "/en/home"
    },
    ...
  }
  ```

- Upgrade multiple dependencies ([#565](https://github.com/seek-oss/sku/pull/565))

## 10.9.4

### Patch Changes

- Upgrade Vocab depenedency ([#566](https://github.com/seek-oss/sku/pull/566))

## 10.9.3

### Patch Changes

- Fix `sku serve` for multi-language apps ([#562](https://github.com/seek-oss/sku/pull/562))

## 10.9.2

### Patch Changes

- Compile vocab files before lint and test commands ([#560](https://github.com/seek-oss/sku/pull/560))

## 10.9.1

### Patch Changes

- Add multi-language support for server rendered applications ([#556](https://github.com/seek-oss/sku/pull/556))

- Upgrade Vocab to v0.0.8 with new .vocab folder ([#558](https://github.com/seek-oss/sku/pull/558))

  - `useTranslation` renamed to `useTranslations`
  - Support for server-rendered apps with new `addLanguageChunk` render parameter
  - Support for custom format locales in `<VocabProvider>`
  - Improved validation for `translation.json`

- Add generated Vocab files to ignore patterns ([#559](https://github.com/seek-oss/sku/pull/559))

## 10.9.0

### Minor Changes

- Experimental support for multi-language builds using [Vocab](https://github.com/seek-oss/vocab) ([#554](https://github.com/seek-oss/sku/pull/554))

  Not available for SSR applications at this stage.

## 10.8.3

### Patch Changes

- Only generate `.ssl` directory when `httpsDevServer` is enabled ([#552](https://github.com/seek-oss/sku/pull/552))

## 10.8.2

### Patch Changes

- Fix \_addChunk ([#549](https://github.com/seek-oss/sku/pull/549))

## 10.8.1

### Patch Changes

- Expose \_addChunks function in renderApp ([#547](https://github.com/seek-oss/sku/pull/547))

## 10.8.0

### Minor Changes

- Add rootResolution config option and disable for compile packages ([#543](https://github.com/seek-oss/sku/pull/543))

  By default, sku allows you to import modules from the root folder of your repo. e.g. `import something from 'src/modules/something'`. Unfortunately, these kinds of imports only work for apps. In packages, the imports will work locally, but fail when consumed from `node_modules`.

  Adding `"skuCompilePackage": true` to your `package.json` will now disable this behaviour by default. You can also toggle the behaviour by setting `rootResolution` in your sku config.

## 10.7.1

### Patch Changes

- Automatically detect compile packages with @seek scope ([#541](https://github.com/seek-oss/sku/pull/541))

## 10.7.0

### Minor Changes

- **Playroom:** Update to v0.22.0, add `playroomScope` option ([#539](https://github.com/seek-oss/sku/pull/539))

  You can now use Playroom's new custom scope feature by providing a `playroomScope` file.

  **EXAMPLE USAGE**

  sku.config.js:

  ```js
  module.exports = {
    playroomScope: './playroom/useScope.ts',
  };
  ```

  useScope.ts:

  ```js
  import { useToast } from 'braid-design-system';

  export default function useScope() {
    return {
      showToast: useToast(),
    };
  }
  ```

## 10.6.0

### Minor Changes

- Support site specific routes ([#537](https://github.com/seek-oss/sku/pull/537))

  Configured sites can now contain routes which are specific that site. This is useful for cross-brand applications that have different URLs.

  ```js
  // sku.config.js
  module.exports = {
    sites: [
      {
        name: 'alpha',
        host: 'dev.alpha.com.au',
        routes: [
          { route: '/', name: 'home' },
          { route: '/details', name: 'details' },
        ],
      },
      {
        name: 'beta',
        host: 'dev.beta.com.au',
        routes: [
          { route: '/home', name: 'home' },
          { route: '/my-details', name: 'details' },
        ],
      },
    ],
  };
  ```

## 10.5.4

### Patch Changes

- Update to TypeScript 4 and ESLint 7 ([#535](https://github.com/seek-oss/sku/pull/535))

## 10.5.3

### Patch Changes

- Allow force exiting build script ([#533](https://github.com/seek-oss/sku/pull/533))

## 10.5.2

### Patch Changes

- Add tracking for CSS file types ([#531](https://github.com/seek-oss/sku/pull/531))

## 10.5.1

### Patch Changes

- Add async render types ([#529](https://github.com/seek-oss/sku/pull/529))

## 10.5.0

### Minor Changes

- Add client side hot module reloading ([#527](https://github.com/seek-oss/sku/pull/527))

  Hot module reloading (HMR) is updating JS and CSS assets without requiring a full page refresh. This allows you to retain app state between code changes. This change introduces hot reloading to React components, treat files and CSS modules.

  **React fast-refresh**

  For fast-refresh to work there are a few gotchas to watch out. For components to succesfully hot reload, they must:

  - Have a display name. Avoid using `export default` with anonymous functions.
  - The file must only export React components (excluding types as they are not runtime exports)

  We're considering adding lint rules for these scenarios in future.

  **NOTE:** React >16.9 is required for fast-refresh to work

  In some cases a change cannot be hot reloaded, in these situations sku should fallback to performing a full page refresh. You should **never** need to manually refresh your browser.

  If your app is not hot reloading when you would expect it to or you are being forced to manually refresh the page, please contact #sku-support.

  You can disable HMR by setting `SKU_HOT=false`.

## 10.4.1

### Patch Changes

- Fix empty style tags in rendered HTML when `cspEnabled` is set to `true` ([#525](https://github.com/seek-oss/sku/pull/525))

## 10.4.0

### Minor Changes

- Add ability to turn on HTTPS on the local development server with `httpsDevServer` and define express middleware with a `dev-middleware.js` file in the root of the SKU project. ([#523](https://github.com/seek-oss/sku/pull/523))

## 10.3.6

### Patch Changes

- Playroom: Add passthrough support for `paramType` via `playoomParamType` config option. ([#517](https://github.com/seek-oss/sku/pull/517))

## 10.3.5

### Patch Changes

- Validate that there is only a single copy of react-treat ([#514](https://github.com/seek-oss/sku/pull/514))

## 10.3.4

### Patch Changes

- Add contenthash to storybook/playroom assets in production mode ([#512](https://github.com/seek-oss/sku/pull/512))

## 10.3.3

### Patch Changes

- Automatically identify Buildkite agents as CI ([#510](https://github.com/seek-oss/sku/pull/510))

## 10.3.2

### Patch Changes

- Fix ReferenceError in compilePackages validation ([#508](https://github.com/seek-oss/sku/pull/508))

## 10.3.1

### Patch Changes

- Only target internal images/svgs with loaders ([#505](https://github.com/seek-oss/sku/pull/505))

## 10.3.0

### Minor Changes

- Remove usage of [`assert`](https://nodejs.org/api/assert.html) in production ([#503](https://github.com/seek-oss/sku/pull/503))

  If you use [Node's `assert` library](https://nodejs.org/api/assert.html) or its [browser port](https://www.npmjs.com/package/assert), your assertions will now be automatically removed in production via [`babel-plugin-unassert`](https://github.com/unassert-js/babel-plugin-unassert). This allows you to perform more expensive checks during development without worrying about the perfomance impacts on users.

  For example, let's assume you wrote the following code:

  ```js
  import React from 'react';
  import assert from 'assert';

  export const Rating = ({ rating }) => {
    assert(rating >= 0 && rating <= 5, 'Rating must be between 0 and 5');

    return <div>...</div>;
  };
  ```

  In production, the code above would be logically equivalent to this:

  ```js
  import React from 'react';

  export const Rating = ({ rating }) => <div>...</div>;
  ```

- Add Content Security Policy generation for the `script-src` directive ([#502](https://github.com/seek-oss/sku/pull/502))

  See the [Content Security Policy](https://seek-oss.github.io/sku/#/./docs/csp) section of the sku docs for setup instructions.

## 10.2.0

### Minor Changes

- Add environment arg support to `sku start` ([#498](https://github.com/seek-oss/sku/pull/498))

  `sku start` defaults to using the first environment in your `environments` array. You can now specify any environment via the `--environment` argument, mimicking the `sku serve` behaviour.

  ```bash
  $ sku start --environment production
  ```

## 10.1.2

### Patch Changes

- Add support for `@seek/sku-telemetry`. ([#495](https://github.com/seek-oss/sku/pull/495))

  To help improve sku, you should add this as a dev dependency:

  ```bash
  $ yarn add --dev @seek/sku-telemetry
  ```

  or

  ```bash
  $ npm install --save-dev @seek/sku-telemetry
  ```

## 10.1.1

### Patch Changes

- Add missing dependency for `sku serve` ([#490](https://github.com/seek-oss/sku/pull/490))

## 10.1.0

### Minor Changes

- Add sku serve command ([#487](https://github.com/seek-oss/sku/pull/487))

  The `sku serve` command adds the abilty to view the output of `sku build` without deploying to an environment. This is helpful for:

  - Debugging production build only issues
  - Running integration tests
  - Viewing the app on legacy browsers (that require `sku build` only features)
  - Performance testing

  [Site/host routing](https://seek-oss.github.io/sku/#/./docs/multi-site?id=switching-site-by-host) works the same as `sku start`. However, you can set your preferred site via the `--site` argument. e.g. `sku serve --site seekAnz`. By default the first site is used.

  You can specify which [environment](https://seek-oss.github.io/sku/#/./docs/configuration?id=environments) you want to serve via the `--environment` argument. e.g. `sku serve --environment production`. By default the first environment is used.

  **Note**: `sku serve` does not work for apps that use a different domain for their [publicPath](https://seek-oss.github.io/sku/#/./docs/configuration?id=publicpath).

### Patch Changes

- Introduce new dynamic route syntax ([#487](https://github.com/seek-oss/sku/pull/487))

  Dynamic routes should now be indicated by a `# sku character rather than`:`.

  Usage of `:` for dynamic routes is now deprecated and will not work with the new `sku serve` command. However, `sku start` and `sku build` will continue to work.

  **MIGRATION GUIDE**

  Update your routes in `sku.config.js` to use the new `# sku syntax.

  ```diff
  {
  - routes: ['/job/:id'],
  + routes: ['/job/$id'],
  }
  ```

  **Warning**: This will cause the affected routes to output a different folder structure. Make sure to update your web server route rules for the affected routes before releasing this change.

  Please reach out to #sku-support if you have any questions.

## 10.0.2

### Patch Changes

- Fix template formatting ([#484](https://github.com/seek-oss/sku/pull/484))

  This updates the template files to be in line with new linting rules

- Fix memory leak in sku start ([#486](https://github.com/seek-oss/sku/pull/486))

## 10.0.1

### Patch Changes

- Run eslint fix on init template ([#482](https://github.com/seek-oss/sku/pull/482))

  This ensures correct import ordering in the template.

## 10.0.0

### Major Changes

- Remove deprecated react-treat re-exports from `sku/treat` ([#471](https://github.com/seek-oss/sku/pull/471))

  **BREAKING CHANGES**

  `react-treat` APIs (`useStyles`, `TreatProvider` & `useClassName`) can no longer be imported from `sku/treat`

  **MIGRATION GUIDE**

  Update all imports of `useStyles`, `TreatProvider` & `useClassName` to `sku/react-treat`.

  e.g.

  ```diff
  -import { useStyles } from 'sku/treat';
  +import { useStyles } from 'sku/react-treat';
  ```

- Remove SSR react-hot-loader support ([#472](https://github.com/seek-oss/sku/pull/472))

  **BREAKING CHANGE**

  Previously, sku featured partial setup for `react-hot-loader` v3 in SSR apps. It was not complete and still required tricky wiring code from the consumer app. The `react-hot-loader` dependency and `react-hot-loader/patch` client entry has now been removed from sku.

  If you want to continue using `react-hot-loader` with sku, you'll need to use `dangerouslySetWebpackConfig` to set the required `react-hot-loader` config. This approach is not recommended and will be very difficult to maintain.

  **Note**: We plan on looking into proper hot reload support (for static and SSR app) once the [react fast-refresh](https://github.com/facebook/react/issues/16604) project has a stable implementation for webpack.

- Update minimum required node version to >=10.13.0 ([#463](https://github.com/seek-oss/sku/pull/463))

  **BREAKING CHANGE**

  Node versions < 10.13.0 no longer supported.

- Remove support for `.css.js` files ([#470](https://github.com/seek-oss/sku/pull/470))

  **BREAKING CHANGE**

  `.css.js` ([css-in-js-loader](https://github.com/naistran/css-in-js-loader)) files are no longer supported.

  **MIGRATION GUIDE**

  Any existing `.css.js` files will need to be removed. Ideally, replace these styles with Braid components. If that's not possible you can re-create the styles using [css-modules](https://seek-oss.github.io/sku/#/./docs/styling?id=locally-scoped-css) or [treat files](https://seek-oss.github.io/sku/#/./docs/styling?id=treat).

  **Note**: It is our understanding that there is very limited use of this feature. If you have many `.css.js` files in your project please contact #sku-support for help.

### Minor Changes

- Update Prettier to v2 ([#463](https://github.com/seek-oss/sku/pull/463))

  **MIGRATION GUIDE**

  Prettier update will require running `sku format`.

  The `arrowParens` option is now set to `always`.

  See [Prettier 2.0.0](https://prettier.io/blog/2020/03/21/2.0.0.html) for more info on the changes.

- Add import order linting ([#477](https://github.com/seek-oss/sku/pull/477))

  You can now optionally enable linting of import order by adding `orderImports: true` to your sku config. This rule supports auto-fix.

  **WARNING**

  Changing import order can affect the behaviour of your application. After enabling `orderImports`, please ensure your app still works and looks as expected.

  Also, any existing comments (e.g. `@ts-ignore`) above imports will **not** be moved as part of the autofix. If your app has a lot of `@ts-ignore` comments then please be very wary when applying this rule.

- Update to [Jest 25](https://jestjs.io/blog/2020/01/21/jest-25) ([#468](https://github.com/seek-oss/sku/pull/468))

### Patch Changes

- Update dependencies ([#440](https://github.com/seek-oss/sku/pull/440))

  See PR for more info.

- Update all babel deps to 7.9+ ([#471](https://github.com/seek-oss/sku/pull/471))

- Update min typescript version to 3.8.3 ([#471](https://github.com/seek-oss/sku/pull/471))

- Update eslint-config-seek to v6 ([#440](https://github.com/seek-oss/sku/pull/440))

  **MIGRATION GUIDE**

  Run `sku lint` to check if any new rules are breaking. Running `sku format` first will fix any auto-fixable rules. See the [eslint-config-seek release notes](https://github.com/seek-oss/eslint-config-seek/releases) for more info on changes.

- Improve error messages for incorrect client entries ([#467](https://github.com/seek-oss/sku/pull/467))

- Update `html-render-webpack-plugin` to v2 ([#474](https://github.com/seek-oss/sku/pull/474))
