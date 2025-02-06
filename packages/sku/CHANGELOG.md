# sku

## 13.4.1

### Patch Changes

- `sku init`: Add a `pnpm.onlyBuiltDependencies` field to the `package.json` file if `pnpm` v10 is detected ([#1160](https://github.com/seek-oss/sku/pull/1160))

  As of [`pnpm` v10], dependency lifecycle scripts are no longer run by default. Instead, explicit permission must be given on a per-dependency basis.

  New `sku` projects will have this field added automatically if `pnpm` v10 is detected in order to ensure `sku` and its dependencies can run necessary lifecycle scripts after installation.

  [`pnpm` v10]: https://github.com/pnpm/pnpm/releases/tag/v10.0.0

## 13.4.0

### Minor Changes

- Add WebP and AVIF image format support to sku ([#1119](https://github.com/seek-oss/sku/pull/1119))

  Support for `webp` and `avif` image formats has been added. Note that browser support for these formats may vary. To ensure compatibility across browsers, consumers are advised to use the `<picture>` element with fallback formats.

### Patch Changes

- Fixes a bug that caused React 19 applications to fail during `sku build` ([#1143](https://github.com/seek-oss/sku/pull/1143))

  Note: remaining on React 18 is recommended until `sku` officially supports React 19. Updating your application to React 19 may require overriding dependency versions by configuring your package manager. Additionally, there may be other incompatibilities that haven't been found yet.

## 13.3.0

### Minor Changes

- Update TypeScript to 5.6 ([#1048](https://github.com/seek-oss/sku/pull/1048))

  This release includes breaking changes. See the [TypeScript 5.6 announcement] for more information.

  [TypeScript 5.6 announcement]: https://devblogs.microsoft.com/typescript/announcing-typescript-5-6/

- Update and pin `browserslist-config-seek` to version `3.2.0` ([#1078](https://github.com/seek-oss/sku/pull/1078))

  `sku` applications and libraries now default to supporting the following browser versions:

  | Browser          | Oldest supported version |
  | ---------------- | ------------------------ |
  | Chrome           | 84                       |
  | Edge             | 84                       |
  | Safari           | 14.1                     |
  | Firefox          | 86                       |
  | Samsung Internet | 14                       |

### Patch Changes

- Set `esbuild-register` target to `node18.20` ([#1076](https://github.com/seek-oss/sku/pull/1076))

- `sku translations`: Throw an error when `languages` has not been configured ([#1090](https://github.com/seek-oss/sku/pull/1090))

  Previously, if `languages` was not configured, the `sku translations` command would log a message and continue to run the command, which would eventually error due to the lack of a vocab config (generated from the `languages` config).
  We now throw an error sooner to make it clear that the `languages` configuration is required to run any `sku translations` commands.

- `sku translations`: Suggest using the `vocab` CLI when `languages` is not configured and a vocab config file is detected ([#1090](https://github.com/seek-oss/sku/pull/1090))

- `sku translations`: Improve log messages and align timing of log messages with actual command execution ([#1075](https://github.com/seek-oss/sku/pull/1075))

- `sku pre-commit`: Update `lint-staged` dependency to `^15.2.10` ([#1084](https://github.com/seek-oss/sku/pull/1084))

- Update `env-ci` dependency to `^11.1.0` ([#1082](https://github.com/seek-oss/sku/pull/1082))

- `sku translations`: When `languages` is configured in sku config _and_ a vocab config file is found, a warning will be shown telling the user that the vocab config file will be ignored ([#1090](https://github.com/seek-oss/sku/pull/1090))

## 13.2.1

### Patch Changes

- Improve error handling and messaging when opening the user's browser during the `start`, `start-ssr` and `serve` scripts ([#1069](https://github.com/seek-oss/sku/pull/1069))

  This fixes a macOS error where `sku` would crash when failing to detect the user's default browser.
  Instead, the user will be shown a warning message with instructions to enable the system permission required to fix the issue.

## 13.2.0

### Minor Changes

- Add experimental `renderToStringAsync` parameter in `renderApp` ([#1050](https://github.com/seek-oss/sku/pull/1050))

  The new `renderToStringAsync` method can be called instead of React DOM's `renderToString`. It is an asynchronous function, but once awaited should return the same result.

  This new function won't error when hitting suspended components during a static render, instead it'll wait for all suspended boundaries to resolve.

  **Note:** `react-dom` is now an optional peer dependency for use in this function. All known uses of static rendering use `react-dom` and shouldn't need to make a change.

  The function is being provided to enable teams to trial the behaviour, but is not encouraged for production use.

  ```diff
  -import { renderToString } from 'react-dom/server';

  const skuRender: Render<RenderContext> = {
  -  renderApp: ({ SkuProvider, environment }) => {
  +  renderApp: async ({ SkuProvider, environment, renderToStringAsync }) => {
  -    const appHtml = renderToString(
  +    const appHtml = await renderToStringAsync(
        <SkuProvider>
          <App environment={environment as ClientContext['environment']} />
        </SkuProvider>,
      );

      return {
        appHtml,
      };
    },
    // ...
  };
  ```

  This new feature is experimental, and is likely to change in implementation or may be removed completely.

### Patch Changes

- Disable `babel-loader` cache compression ([#1060](https://github.com/seek-oss/sku/pull/1060))

  `sku` applications tend to transpile many modules and upload all cache files as a single compressed file. This makes compressing each individual cache file superfluous, so this feature has been disabled.

- Adds "Chrome" and "Edge" as fallback browser names for reusing existing tabs, improving compatibility with different Chromium browser versions which may use abbreviated browser names. ([#1061](https://github.com/seek-oss/sku/pull/1061))

## 13.1.3

### Patch Changes

- Reverts #1039 ([#1053](https://github.com/seek-oss/sku/pull/1053))

  This change was causing a dependency to be cloned via `git` which may not be available in all CI envrionments.

## 13.1.2

### Patch Changes

- Replace `ejs` dependency with `eta` ([#1044](https://github.com/seek-oss/sku/pull/1044))

- Update `didyoumean2` dependency to fix issue when running `npx sku init` ([#1051](https://github.com/seek-oss/sku/pull/1051))

## 13.1.1

### Patch Changes

- Use HTTPS URL for `zendesk/babel-plugin-react-displayname` dependency to hopefully prevent it from being cloned via SSH ([#1039](https://github.com/seek-oss/sku/pull/1039))

- Replace `@manypkg/find-root` dependency with `find-up` ([#1040](https://github.com/seek-oss/sku/pull/1040))

- Replace `@antfu/ni` dependency with `package-manager-detector` ([#1040](https://github.com/seek-oss/sku/pull/1040))

## 13.1.0

### Minor Changes

- Widen support for reusing existing browser tab to more Chromium browsers. ([#1036](https://github.com/seek-oss/sku/pull/1036))

  `start` and `start-ssr` scripts would previously only reuse an existing tab in Google Chrome.
  This change adds support for the following Chromium browsers:

  - Google Chrome,
  - Google Chrome Canary,
  - Microsoft Edge,
  - Brave Browser,
  - Vivaldi,
  - Chromium,
  - Arc.

  A tab will be reused if:

  - The OS is macOS,
  - The user's default browser is a supported Chromium browser,
  - The user has an existing tab open in a supported Chromium browser with the exact same URL.

  If any of the above is not true, a new tab will be created in the user's default browser.

## 13.0.4

### Patch Changes

- Fixes a bug preventing `.mdx` files from loading in Storybook when using `sku`'s `webpackFinal` Storybook configuration ([#1032](https://github.com/seek-oss/sku/pull/1032))

## 13.0.3

### Patch Changes

- Fix incorrect path in ignore files when running `sku init` ([#1028](https://github.com/seek-oss/sku/pull/1028))

  sku generates ignore files (e.g. `.eslintignore`) for the project.
  When ran as part of `sku init`, the current working directory (CWD) would sometimes be incorrect.
  It should now give the same result as `sku configure`.

  This change includes a refactor to how the webpack target directory is set in ignore files.

## 13.0.2

### Patch Changes

- Replace `sku/config/jest` entrypoint with `sku/jest-preset` ([#1024](https://github.com/seek-oss/sku/pull/1024))

  **BREAKING CHANGE FOR CUSTOM JEST CONFIG**:

  This breaking change will only affect a very small number of projects that have a custom Jest configuration/wish to debug tests in their IDE, and it is intended to be a quick fix/improvement for a feature released in `sku@13.0.0`. Therefore, it's not being released as a major version.

  The `sku/config/jest` entrypoint has been removed in favor of a new `sku/jest-preset` entrypoint. The `sku/jest-preset` module is a better way to expose a [jest preset], rather than a relative path (the previous implementation), as it works even if `sku` is hoisted to a parent `node_modules` directory.

  **MIGRATION GUIDE**:

  ```diff
  // jest.config.js
  - const { preset } = require('sku/config/jest');

  /** @type {import('jest').Config} */
  module.exports = {
     // If you've already migrated to sku v13
  -  preset,
     // If you're still on sku v12.x
  -  preset: 'sku/config/jest',
  +  preset: 'sku',
  };
  ```

  [jest preset]: https://jestjs.io/docs/configuration#preset-string

## 13.0.1

### Patch Changes

- Add `pnpm-lock.yaml` to `.prettierignore` and `.eslintignore` ([#1021](https://github.com/seek-oss/sku/pull/1021))

## 13.0.0

### Major Changes

- Export jest preset ([#984](https://github.com/seek-oss/sku/pull/984))

  **BREAKING CHANGE**:

  The jest preset is now accessible via the `sku` preset. This may affect users that require a jest config for debugging tests in their IDE. See the [testing documentation] for more information.

  **MIGRATION GUIDE**:

  ```diff
  // jest.config.js
  /** @type {import('jest').Config} */
  module.exports = {
  -  preset: 'sku/config/jest',
  +  preset: 'sku',
  };
  ```

  [testing documentation]: https://seek-oss.github.io/sku/#/./docs/testing

- Update default supported browsers ([#1000](https://github.com/seek-oss/sku/pull/1000))

  `sku` applications and libraries now default to supporting more recent browser versions:

  | Browser          | Oldest supported version |
  | ---------------- | ------------------------ |
  | Chrome           | 84                       |
  | Edge             | 84                       |
  | Safari           | 14.1                     |
  | Firefox          | 63                       |
  | Samsung Internet | 14.0                     |

  **BREAKING CHANGE**:

  Production builds will now contain code that may not be compatible with older browser versions. If your application still needs to support older browsers, you can configure a custom [browserslist] query via the [`supportedBrowsers`] configuration option in your sku config.

  [browserslist]: https://browsersl.ist/
  [`supportedBrowser`]: https://seek-oss.github.io/sku/#/./docs/configuration?id=supportedbrowsers

- Remove Storybook-related features from `sku` ([#996](https://github.com/seek-oss/sku/pull/996))

  **BREAKING CHANGE**

  All Storybook-related features have been removed from `sku`. Sku no longer installs Storybook dependencies, configures Storybook, provides Storybook CLI commands, or re-exports Storybook APIs. If you are using Storybook, you will need to install Storybook dependencies yourself. See [`sku`'s Storybook documentation][storybook docs] for more information.

  [storybook docs]: https://seek-oss.github.io/sku/#/./docs/storybook

  **MIGRATION GUIDE**:

  #### Update your `sku` config

  The following `sku` configuration options have been removed:

  - `storybookAddons`
  - `storybookPort`
  - `storybookStoryStore`
  - `storybookTarget`

  Please remove these properties from your sku configuration file, but keep the values around for use later in the migration.

  #### Update your ignore files

  Sku no longer manages certain Storybook-related ignore file entries.
  Run `sku configure` to update your ignore files:

  ```sh
  pnpm exec sku configure
  ```

  You will need to re-add your `storybookTarget` value (from the previous step) to your `.prettierignore`, `.eslintignore`, and `.gitignore` files.

  #### Install Storybook dependencies

  `sku` was previously installing Storybook v7 dependencies for you. The first command below will install the latest (v8) Storybook dependencies.

  If you wish to stay on Storybook v7 for the time being, use the second command below.

  **NOTE**: Consumers that still depend on the deprecated `storiesOf` API will need to stay on Storybook v7 until they migrate away from this API.

  ```sh
  # Storybook v8
  pnpm install -D storybook @storybook/react @storybook/react-webpack5 @storybook/addon-webpack5-compiler-babel
  ```

  ```sh
  # Storybook v7
  pnpm install -D storybook@^7.6.17 @storybook/react@^7.6.17 @storybook/react-webpack5@^7.6.17
  ```

  #### Configure Storybook

  Sku no longer configures your [Storybook main configuration file][sb main] for you. To migrate to a minimal, `sku`-compatible Storybook configuration, first locate your `.storybook/main.js` file.

  ```js
  // .storybook/main.js - Old configuration

  /** THIS FILE IS GENERATED BY SKU, MANUAL CHANGES WILL BE DISCARDED **/
  import storybookConfig from 'sku/config/storybook';

  export default { ...storybookConfig };
  ```

  Rename this file to `.storybook/main.ts` and replace its contents with the following, making adjustments as necessary for your project:

  ```ts
  // .storybook/main.ts - New configuration

  import { babel, webpackFinal } from 'sku/config/storybook';
  import type { StorybookConfig } from '@storybook/react-webpack5';

  export default {
    stories: ['../src/**/*.stories.tsx'],
    features: {
      // Required for Storybook v7 if using the `storiesOf` API.
      // If you set `storybookStoryStore: false` in your sku config, you will want this.
      storyStoreV7: false,
    },
    framework: {
      name: '@storybook/react-webpack5',
      options: {
        builder: {
          fsCache: true, // For faster startup times after the first `storybook dev`
        },
      },
    },
    addons: [
      // Copy addons from your `storybookAddons` sku config here
      '@storybook/addon-webpack5-compiler-babel', // Required for Storybook >=8.0.0
    ],
    babel,
    webpackFinal,
  } satisfies StorybookConfig;
  ```

  See [`sku`'s Storybook documentation][storybook docs] for more information on configuring Storybook.

  [sb main]: https://storybook.js.org/docs/api/main-config/main-config
  [storybook docs]: https://seek-oss.github.io/sku/#/./docs/storybook

  #### Update `package.json` scripts

  The `sku` CLI no longer provides the `sku storybook` and `sku build-storybook` commands. Please migrate to [the official Storybook CLI][storybook cli]:

  ```diff
  // package.json
  {
    "scripts": {
  -    "storybook": "sku storybook",
       // Replace 8081 with your previously configured `storybookPort`,
       // if you configured one and wish to keep it
  +    "storybook": "storybook dev --port 8081",
  -    "build:storybook": "sku build-storybook"
        // Replace `dist-storybook` with your previously configured `storybookTarget`,
        // if you configured one and wish to keep it
  +    "build:storybook": "storybook build --output-dir dist-storybook"
    }
  }
  ```

  If you have a [multi-language] application, you will want to compile your translations before running the Storybook CLI:

  ```jsonc
  // package.json
  {
    "scripts": {
      "storybook": "sku translations compile && storybook dev" // or storybook build
    }
  }
  ```

  If you want to run a development Storybook and see Vocab translations update in real time, you can run the [`sku translations compile --watch`][translations compile watch] command at the same time as `storybook dev`.
  This can be achieved via a package such as [`concurrently`], or if you are using `pnpm` you can use `pnpm`'s built-in support for [running multiple scripts] in parallel.

  Please read the [Storybook CLI documentation] for more information.

  [multi-language]: ./docs/multi-language
  [translations compile watch]: ./docs/cli?id=translations-compile
  [`concurrently`]: https://www.npmjs.com/package/concurrently
  [running multiple scripts]: https://pnpm.io/8.x/cli/run#running-multiple-scripts
  [storybook cli]: https://storybook.js.org/docs/cli/

  #### Update Storybook imports

  `sku` no longer re-exports Storybook APIs under the `sku/@storybook/react` entrypoint. Please update your imports to use the official Storybook package:

  ```diff
  // MyComponent.stories.tsx

  -import type { Meta } from 'sku/@storybook/react';
  +import type { Meta } from '@storybook/react';
  ```

- Remove LESS style support ([#1005](https://github.com/seek-oss/sku/pull/1005))

  **BREAKING CHANGE**:

  [LESS] style support has been removed.

  **MIGRATION GUIDE**:

  Please migrate all styles defined in `.less` files to [Vanilla Extract] styles. `*.less.d.ts` files are no longer git-ignored and should be deleted. Reach out in [`#sku-support`] if you need help with this migration.

  [Vanilla Extract]: https://seek-oss.github.io/sku/#/./docs/styling?id=vanilla-extract
  [LESS]: http://lesscss.org/
  [`#sku-support`]: https://seek.enterprise.slack.com/archives/CDL5VP5NU

- Target `sku`'s minimum supported node version when building the server entry ([#1006](https://github.com/seek-oss/sku/pull/1006))

  **BREAKING CHANGE**

  When building the server entry, the output code was previously transpiled to be compatible with a relatively old version of Node.js. This change updates the version to mirror sku's minimum supported Node.js version (18.20.0 at time of writing). SSR users should ensure their server's Node.js runtime is up-to-date with the minimum supported version.

- Drop support for Node.js versions below 18.20.0 ([#986](https://github.com/seek-oss/sku/pull/986))

  **BREAKING CHANGE**:

  The minimum supported Node.js version is now 18.20.0. Consumers must upgrade to Node.js v18.20.0 or later.

- Remove support for `orderImports` config option ([#1014](https://github.com/seek-oss/sku/pull/1014))

  **BREAKING CHANGE:**

  `orderImports` is now always enabled and has been removed from the configuration options.

  **MIGRATION GUIDE**

  > To reduce the number of changes when migrating to `sku` v13 you may choose to enable `orderImports` and run `sku format` before upgrading.

  Remove `orderImports` from `sku.config.ts`:

  ```diff
  // sku.config.ts

  import { type SkuConfig } from 'sku';

  export default {
  - orderImports: false,
  - orderImports: true,
  } satisfies SkuConfig;
  ```

  Then run `sku format`.

  **Note:** Changing import order can affect the behaviour of your application. After running `sku format`, please ensure your app still works and looks as expected. Additionally, `@ts-ignore` comments above imports will **not** be moved as part of the autofix. These comments will need be moved manually.

- Remove support for the `env` config property ([#980](https://github.com/seek-oss/sku/pull/980))

  **BREAKING CHANGE**:

  Support for the `env` config property has been removed. This config property was deprecated in sku v7.0.0 in favour of the `environments` property. Please see the [sku v7 migration guide] for more information.

  [sku v7 migration guide]: https://github.com/seek-oss/sku/blob/f37ea1dcbe2d6403bba6897c7a9e0cb9b231c74c/docs/migration-guides/v7.0.0.md#env

- `sourceMapsProd` is now `true` by default ([#979](https://github.com/seek-oss/sku/pull/979))

  **BREAKING CHANGE**:

  `sourceMapsProd` is now `true` by default. To enable the previous behaviour, set `sourceMapsProd: false` in your sku config:

  ```ts
  // sku.config.ts
  import type { SkuConfig } from 'sku';

  export default {
    sourceMapsProd: false,
  } satisfies SkuConfig;
  ```

  **NOTE**: Production source maps can increase memory usage during builds to the point where the Node process exhausts its heap memory. If this occurs, you can increase the memory limit for the Node process by setting the `NODE_OPTIONS` environment variable to `--max-old-space-size=4096` (or a higher value) before running the build command.

  For example:

  ```sh
  NODE_OPTIONS=--max-old-space-size=4096 sku build
  ```

- Add peer dependency on `@types/react@^17.0.0 || ^18.0.0` ([#1016](https://github.com/seek-oss/sku/pull/1016))

  **BREAKING CHANGE**

  `sku` now has a peer dependency on `@types/react@^17.0.0 || ^18.0.0`. Most, if not all consumers of `sku` should already have `@types/react` installed, but if not, you will need to install it.

- Add explicit package exports ([#984](https://github.com/seek-oss/sku/pull/984))

  **BREAKING CHANGE**:

  Importing from arbitrary subpaths within `sku` is no longer possible. See the [API documentation] for a comprehensive list of `sku`'s API entrypoints.

  [API documentation]: https://seek-oss.github.io/sku/#/./docs/api

- Remove support for the `--env` CLI argument ([#980](https://github.com/seek-oss/sku/pull/980))

  **BREAKING CHANGE**:

  Support for the `--env` CLI argument has been removed. This argument was replaced long ago by the `--envrironment` argument. There is currently no consumer usage of this argument, so there should be no changes required.

- Remove type-only imports during transpilation and enforce correct type-only import syntax with `verbatimModuleSyntax: true` ([#983](https://github.com/seek-oss/sku/pull/983))

  This change enables babel to mimic the behaviour of TypeScript's [`verbatimModuleSyntax`] compiler option. The following code demonstrates the result of this change when transpiling TypeScript to JavaScript:

  ```ts
  // Erased entirely
  import type { A } from 'a';

  // Rewritten to `import { b } from "bcd";`
  import { b, type c, type d } from 'bcd';

  // Rewritten to `import {} from "xyz";`
  import { type xyz } from 'xyz';
  ```

  This change is not expected to have an effect on bundled application code or library code. However, it may surface some TypeScript errors in `compilePackage` dependencies that do not adhere to the correct type-only import syntax. These errors should be fixed in the dependency's codebase.

  [`verbatimModuleSyntax`]: https://www.typescriptlang.org/tsconfig#verbatimModuleSyntax

- `sku init`: Install dependencies with the package manager that was used to run the command ([#982](https://github.com/seek-oss/sku/pull/982))

  **BREAKING CHANGE**:

  The `sku init` command will now install dependencies with the package manager that was used to run the command. This can be overridden via the `--packageManager` flag:

  ```sh
  npx sku init my-app # Will install dependencies using npm
  pnpm dlx sku init my-app # Will install dependencies using pnpm
  npx sku init --packageManager yarn my-app # Will install dependencies using yarn
  ```

- Drop support for `react` versions below `17.0.0` ([#1016](https://github.com/seek-oss/sku/pull/1016))

  **BREAKING CHANGE**

  `sku` no longer supports react versions below `17.0.0`. Please upgrade your react version to `17.0.0` or higher.

- Remove support for `persistentCache` configuration option ([#1013](https://github.com/seek-oss/sku/pull/1013))

  **BREAKING CHANGE:**

  Disabling `persistentCache` was previously necessary when using [treat], which is no longer supported in `sku`. `persistentCache` is now always enabled and has been removed from the configuration options.

  [treat]: https://seek-oss.github.io/treat/

  **MIGRATION GUIDE:**

  Remove the `persistentCache` option from your sku config.

  ```diff
  // sku.config.ts

  import { type SkuConfig } from 'sku';

  export default {
  - persistentCache: false,
  - persistentCache: true,
  } satisfies SkuConfig;
  ```

- Drop explicit file extensions when calling `prettier` ([#985](https://github.com/seek-oss/sku/pull/985))

  **BREAKING CHANGE**:

  `sku` no longer passes explicit extensions to `prettier` during `sku lint`/`sku format`. Instead, your application's root directory will be the target, and `prettier` will format all files it supports. This may result in some files being formatted that were not previously formatted by `prettier`.

- Remove support for the `--tenant` CLI argument ([#980](https://github.com/seek-oss/sku/pull/980))

  **BREAKING CHANGE**:

  Support for the `--tenant` CLI argument has been removed. This is an old argument that has been unused within `sku` for a long time. There is currently no consumer usage of this argument, so there should be no changes required.

- Remove support for the `--build` CLI argument ([#980](https://github.com/seek-oss/sku/pull/980))

  **BREAKING CHANGE**:

  SUpport for the `--build` CLI argument has been removed. This is an old argument that has been unused within `sku` for a long time. There is currently no consumer usage of this argument, so there should be no changes required.

### Minor Changes

- Upgrade `eslint` to `^8.56.0` and `eslint-config-seek` to `^13.0.0` ([#986](https://github.com/seek-oss/sku/pull/986))

  Due to changes in `eslint-config-seek@13.x`, consumers may see new linting errors or warnings. Some of these may be auto-fixable via `sku format`, but others may require manual intervention. Please see [the `eslint-config-seek` changelog][changelog] for more information.

  [changelog]: https://github.com/seek-oss/eslint-config-seek/blob/master/CHANGELOG.md

- Add `dom.iterable` to the tsconfig `lib` compiler option ([#983](https://github.com/seek-oss/sku/pull/983))

  This change provides type definitions for iterable APIs on some DOM APIs. For example, this enables using [`for...of` syntax] or the [`keys()`] method on `URLSearchParams`:

  ```ts
  const params = new URLSearchParams('a=1&b=2');

  for (const [key, value] of params) {
    // Prints:
    // a 1
    // b 2
    console.log(key, value);
  }

  for (const key of params.keys()) {
    // Prints:
    // a
    // b
    console.log(key);
  }
  ```

  [`for...of` syntax]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of
  [`keys()`]: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/keys

### Patch Changes

- Loosen `esbuild` dependency version to help prevent multiple versions of it ending up in `node_modules` ([#1018](https://github.com/seek-oss/sku/pull/1018))

- Update `@vocab/phrase` dependency to `^2.0.1` ([#1018](https://github.com/seek-oss/sku/pull/1018))

- Update `@swc/core` dependency to `^1.6.13` ([#1018](https://github.com/seek-oss/sku/pull/1018))

## 12.8.1

### Patch Changes

- Fixes a bug causing `sku test --watch` to not put `jest` in watch mode ([#1009](https://github.com/seek-oss/sku/pull/1009))

## 12.8.0

### Minor Changes

- Export a `Server` type for `sku`'s server entrypoint ([#981](https://github.com/seek-oss/sku/pull/981))

  **EXAMPLE USAGE**:

  ```tsx
  // server.tsx
  import { renderToString } from 'react-dom/server';
  import type { Server } from 'sku';
  import { App } from './App';

  export default (): Server => ({
    renderCallback: ({ SkuProvider, getHeadTags, getBodyTags }, _req, res) => {
      const app = renderToString(
        <SkuProvider>
          <App />
        </SkuProvider>,
      );

      res.send(/* html */ `
        <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <title>My Awesome Project</title>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              ${getHeadTags()}
            </head>
            <body>
              <div id="app">${app}</div>
              ${getBodyTags()}
            </body>
         </html>`);
    },
  });
  ```

  > [!NOTE]
  > The `Server` type may conflict with existing attempts in projects to define a `Server` type.

## 12.7.0

### Minor Changes

- Update TypeScript from 5.3 to 5.5 ([#1003](https://github.com/seek-oss/sku/pull/1003))

  Both the 5.4 and 5.5 releases include breaking changes. See the [TypeScript 5.4 announcement] and [TypeScript 5.5 announcement] for more information.

  [typescript 5.4 announcement]: https://devblogs.microsoft.com/typescript/announcing-typescript-5-4/
  [typeScript 5.5 announcement]: https://devblogs.microsoft.com/typescript/announcing-typescript-5-5/

- Add support for `--watch` flag to `sku translations compile` ([#989](https://github.com/seek-oss/sku/pull/989))

  The `sku translations compile` command now accepts a `--watch` flag. When this flag is provided, `translations.json` files will be re-compiled whenever changes are detected.

  **EXAMPLE USAGE**:

  ```sh
  sku translations compile --watch
  ```

### Patch Changes

- Update all `@vocab/*` dependencies ([#989](https://github.com/seek-oss/sku/pull/989))

- Fixes a bug where the project name was not being reported correctly when sending telemetry ([#1001](https://github.com/seek-oss/sku/pull/1001))

- Enable `babel-loader` cache ([#990](https://github.com/seek-oss/sku/pull/990))

  Sku's webpack configuration now configures `babel-loader` to emit a cache to `node_modules/.cache/babel-loader`. The primary use case for this cache is speeding up production builds. It can also speed up local development in situations where the webpack cache is invalidated.

- Minify build output with [SWC] ([#992](https://github.com/seek-oss/sku/pull/992))

  Minification of production build output is now performed by [SWC]. Previously this was performed by [Terser]. This should result in a noticeable reduction in build times for larger projects, as well as a slight decrease in bundle size.

  [swc]: https://swc.rs/docs/configuration/minification
  [terser]: https://terser.org/

## 12.6.2

### Patch Changes

- Fix default compile package detection in PNPM repos ([#975](https://github.com/seek-oss/sku/pull/975))

## 12.6.1

### Patch Changes

- When cleaning the build output directory, only delete files within the directory, rather than the entire directory ([#969](https://github.com/seek-oss/sku/pull/969))

## 12.6.0

### Minor Changes

- Add support for [removing assertion functions][assertion removal docs] named `invariant` and assertions from the `tiny-invariant` library, a lightweight alternative to `assert` ([#966](https://github.com/seek-oss/sku/pull/966))

  **EXAMPLE USAGE**:

  ```tsx
  import React from 'react';
  import invariant from 'tiny-invariant';

  export const Rating = ({ rating }: { rating: number }) => {
    invariant(rating >= 0 && rating <= 5, 'Rating must be between 0 and 5');

    return <div>...</div>;
  };
  ```

  [assertion removal docs]: https://seek-oss.github.io/sku/#/./docs/extra-features?id=assertion-removal

## 12.5.1

### Patch Changes

- Remove `rimraf` dependency in favour of Node.js's `rm` ([#961](https://github.com/seek-oss/sku/pull/961))

- Unpin and bump `@pmmmwh/react-refresh-webpack-plugin` ([#959](https://github.com/seek-oss/sku/pull/959))

- Ensure all sku-generated gitignored files are present in `.prettierignore` and `.eslintignore` too ([#957](https://github.com/seek-oss/sku/pull/957))

  Consumers should notice a few new files being added to the sku-managed sections within `.prettierignore` and `.eslintignore` the next time a `sku` command is run:

  ```diff
  # managed by sku
  *.less.d.ts
  +.eslintcache
  +.eslintrc
  +.prettierrc
  .storybook/main.js
  coverage/
  dist-storybook/
  dist/
  report/
  # end managed by sku
  ```

  These changes should be committed to your repo.

- Disable peer dependency validation for PNPM ([#952](https://github.com/seek-oss/sku/pull/952))

  The method we currently use to validate peer dependencies and warn users about duplicate package is not compatible with how PNPM organizes dependencies in `node_modules`. This feature has been disabled for PNPM repos until further notice.

- Replace `memoizee` dependency with `nano-memoize` ([#953](https://github.com/seek-oss/sku/pull/953))

- Replace `fast-glob` with `fdir` and `picomatch` ([#952](https://github.com/seek-oss/sku/pull/952))

- Replace `validate-npm-package-name` dependency with a regexp ([#954](https://github.com/seek-oss/sku/pull/954))

- Improve performance of peer dependency validation ([#952](https://github.com/seek-oss/sku/pull/952))

  Peer dependency validation shoould now complete within a few seconds, rather than a few minutes.

## 12.5.0

### Minor Changes

- Update TypeScript to 5.3 ([#938](https://github.com/seek-oss/sku/pull/938))

  This release includes breaking changes. See the [TypeScript 5.3 announcement] for more information.

  [TypeScript 5.3 announcement]: https://devblogs.microsoft.com/typescript/announcing-typescript-5-3/

### Patch Changes

- Remove `empty-dir` dependency ([#935](https://github.com/seek-oss/sku/pull/935))

- Replace `command-line-args` with `minimist` for parsing CLI arguments ([#940](https://github.com/seek-oss/sku/pull/940))

- Emit incremental TypeScript build info for faster subsequent type checking ([#938](https://github.com/seek-oss/sku/pull/938))

## 12.4.11

### Patch Changes

- Update `webpack-dev-server` to v5 ([#930](https://github.com/seek-oss/sku/pull/930))

- Stop passing `--quiet` flag to the Storybook CLI when running `sku storybook` ([#929](https://github.com/seek-oss/sku/pull/929))

  This flag was added to suppress verbose CLI output, but as of [Storybook CLI v7.1.0][release notes] this also hides the dev server info which includes the URL to access the Storybook UI.

  The flag has now been removed to provide a better default experience when using the Storybook CLI.
  Users can still pass `--quiet` to suppress verbose output if desired:

  ```sh
  pnpm run sku storybook --quiet
  ```

  [release notes]: https://github.com/storybookjs/storybook/releases/tag/v7.1.0-alpha.38

## 12.4.10

### Patch Changes

- Update dependencies ([#917](https://github.com/seek-oss/sku/pull/917))

## 12.4.9

### Patch Changes

- Report `braid-design-system` version via telemetry ([#913](https://github.com/seek-oss/sku/pull/913))

## 12.4.8

### Patch Changes

- Fix running lint-staged when `package.json` files are staged ([#918](https://github.com/seek-oss/sku/pull/918))

## 12.4.7

### Patch Changes

- Fixes a bug where `.cjs` and `.mjs` files were not being transpiled for browser targets ([#906](https://github.com/seek-oss/sku/pull/906))

## 12.4.6

### Patch Changes

- Fix package manager detection in non-monorepos ([#907](https://github.com/seek-oss/sku/pull/907))

## 12.4.5

### Patch Changes

- Bump some dependencies ([#904](https://github.com/seek-oss/sku/pull/904))

## 12.4.4

### Patch Changes

- Remove `node-emoji` dependency ([#902](https://github.com/seek-oss/sku/pull/902))

## 12.4.3

### Patch Changes

- Asynchronously import `node-emoji` to fix ESM require issue ([#900](https://github.com/seek-oss/sku/pull/900))

## 12.4.2

### Patch Changes

- Better support for setting `displayName` on React components when [`displayNamesProd`](https://seek-oss.github.io/sku/#/./docs/configuration?id=displaynamesprod) is true. ([#894](https://github.com/seek-oss/sku/pull/894))

## 12.4.1

### Patch Changes

- Update eslint-config-seek to version 12, which includes the major bump to ESLint 7 and typescript-eslint 6. ([#892](https://github.com/seek-oss/sku/pull/892))
  You can view the specific changes over in [eslint-config-seek].

  The majority of changes should automatically fix when running `sku format`.

  [eslint-config-seek]: https://github.com/seek-oss/eslint-config-seek/blob/master/CHANGELOG.md#1200

## 12.4.0

### Minor Changes

- Enable caching for ESLint and Prettier ([#881](https://github.com/seek-oss/sku/pull/881))

- Add `--packageManager` flag ([#884](https://github.com/seek-oss/sku/pull/884))

  Sku detects package managers in the following order: `yarn` -> `pnpm` -> `npm`.
  The `--packageManager` flag can be used to override the package manager used for the `sku init` script.
  This affects what package manager is used to install dependencies, as well as the scripts present in the initialized app template.

  ```sh
  $ pnpm dlx sku init --packageManager pnpm my-app
  ```

- Adds support for Storybook configuration via the `.storybook` directory ([#878](https://github.com/seek-oss/sku/pull/878))

  sku now supports the standard `.storybook` configuration directory, as documented in [Storybook's configuration documentation].
  Please read [sku's storybook documentation][sku storybook docs] for more info.

  [Storybook's configuration documentation]: https://storybook.js.org/docs/react/configure/overview
  [sku storybook docs]: https://seek-oss.github.io/sku/#/./docs/storybook

- Drop support for running `devServerMiddleware` alongside `sku storybook` ([#878](https://github.com/seek-oss/sku/pull/878))

  Now that sku supports Storybook configuration via the `.storybook` directory, this feature is unnecessary.
  Storybook middleware can be configured by creating a `middleware.js` file in the `.storybook` directory.
  See [the sku docs][sku storybook middleware] for more info.

  **NOTE**: While this is technically a breaking change, it does not affect app builds, therefore it has been downgraded to a `minor` release.

  [sku storybook middleware]: https://seek-oss.github.io/sku/#/./docs/storybook?id=devserver-middleware

- Update TypeScript to 5.2 ([#886](https://github.com/seek-oss/sku/pull/886))

  This release includes breaking changes. See the [TypeScript 5.2 announcement][ts52] for more information.

  [ts52]: https://devblogs.microsoft.com/typescript/announcing-typescript-5-2/

### Patch Changes

- Fixes a bug where sku would fail to suggest existing `package.json` scripts before suggesting its own commands ([#876](https://github.com/seek-oss/sku/pull/876))

- Remove `lodash` dependency ([#883](https://github.com/seek-oss/sku/pull/883))

- Propagate `--config` argument to Storybook process ([#879](https://github.com/seek-oss/sku/pull/879))

  Fixes a bug where `sku storybook` and `sku build-storybook` would not honour a custom sku config specified via the `--config` flag

- Fixes a bug where `pnpm` was not detected correctly when detecting [compile packages](https://seek-oss.github.io/sku/#/./docs/extra-features?id=compile-packages) ([#876](https://github.com/seek-oss/sku/pull/876))

- Bump `@pmmmwh/react-refresh-webpack-plugin` and `webpack-dev-server` dependencies. Remove unused dependencies. ([#885](https://github.com/seek-oss/sku/pull/885))

- Adds support for `pnpm` when suggesting commands ([#876](https://github.com/seek-oss/sku/pull/876))

- Disable Storybook telemetry ([#878](https://github.com/seek-oss/sku/pull/878))

## 12.3.3

### Patch Changes

- Revert storybook config to CJS ([#873](https://github.com/seek-oss/sku/pull/873))

  Fixes a bug where newer storybook versions (>=7.1.0) could not load sku's storybook config

## 12.3.2

### Patch Changes

- Fixes a bug where `.cjs` and `.mjs` files where not being transformed by babel in jest tests ([#868](https://github.com/seek-oss/sku/pull/868))

## 12.3.1

### Patch Changes

- Remove external CSS imports when running Jest ([#865](https://github.com/seek-oss/sku/pull/865))

## 12.3.0

### Minor Changes

- Allow importing external CSS from `node_modules`. ([#861](https://github.com/seek-oss/sku/pull/861))

  CSS from third-party dependencies can be loaded using a side-effect import, e.g.

  ```tsx
  import { SomeComponent } from 'some-package';

  import 'some-package/dist/styles.css';

  export const MyComponent = () => {
    return <SomeComponent>{/* ... */}</SomeComponent>;
  };
  ```

## 12.2.0

### Minor Changes

- Export internal Jest configuration as a [preset](https://jestjs.io/docs/configuration#preset-string) under `sku/config/jest`. This allows consumers to debug tests in their IDE by specifying the preset in their `jest.config.js`: ([#850](https://github.com/seek-oss/sku/pull/850))

  ```js
  /** @type {import('jest').Config} */
  module.exports = {
    preset: 'sku/config/jest',
  };
  ```

- `srcPaths` no longer affects `tsconfig.json#include`. Instead, you can use the [`dangerouslySetTSConfig`][dangerous] option to have more control over which files are included in the type checking process. ([#848](https://github.com/seek-oss/sku/pull/848))

  Previously, sku managed the `include` field in `tsconfig.json`, but this was problematic for projects that wanted more fine grained control over what was included and/or excluded from compilation.

  > **Note**: If you were previously using [`srcPaths`][srcpaths] for this purpose, you should remove the paths which are not source files.

  [dangerous]: https://seek-oss.github.io/sku/#/./docs/configuration?id=dangerouslysettsconfig
  [srcpaths]: https://seek-oss.github.io/sku/#/./docs/configuration?id=srcpaths

- Update `tsconfig.json` options to match the latest version of the TypeScript compiler. ([#844](https://github.com/seek-oss/sku/pull/844))

### Patch Changes

- Upgrade to TypeScript 5.1 ([#844](https://github.com/seek-oss/sku/pull/844))

- Update dependency `eslint-config-seek`. ([#844](https://github.com/seek-oss/sku/pull/844))

  This reverts [the autofix for a Cypress rule][rule] and [improves the performance][eslint] of linting TypeScript files.

  [rule]: https://github.com/seek-oss/eslint-config-seek/releases/tag/v11.2.1
  [eslint]: https://github.com/seek-oss/eslint-config-seek/releases/tag/v11.3.0

- The presence of a `sku.config.js` file previously had an effect on what was included in the `tsconfig.json#include` array. With the removal of the default `include` array, this is no longer the case and you might see a TypeScript error like this: ([#848](https://github.com/seek-oss/sku/pull/848))

  ```
  error TS18003: No inputs were found in config file '/path/to/project/tsconfig.json'. Specified 'include' paths were '["**/*"]' and 'exclude' paths were '[]'.
  ```

  If your project contains only JavaScript files and you see the above error, you should rename `sku.config.js` to `sku.config.ts` and the error will go away.

## 12.1.2

### Patch Changes

- Don't use `.git` folder to find root, only glob PNPM virtual store if PNPM is detected as the package manager ([#845](https://github.com/seek-oss/sku/pull/845))

## 12.1.1

### Patch Changes

- Improve compile package detection in PNPM apps ([#840](https://github.com/seek-oss/sku/pull/840))

- Makes some more of the array types in the sku config type into readonly versions. ([#843](https://github.com/seek-oss/sku/pull/843))
  This allows for arrays that have been declared with `as const` to be passed in.

  Affected fields are `sites`, `sites[].routes`, `site[].languages`, `routes`, and `routes[].languages`.

## 12.1.0

### Minor Changes

- Remove `babel-plugin-dynamic-import-node` dependency ([#835](https://github.com/seek-oss/sku/pull/835))

  This plugin was used to transform dynamic imports into deferred requires within jest tests.
  However, dynamic imports are well supported in Node, so this plugin is no longer required.

### Patch Changes

- Surface unhandled ESLint errors ([#838](https://github.com/seek-oss/sku/pull/838))

- Update `less-loader` and `node-emoji` dependencies ([#835](https://github.com/seek-oss/sku/pull/835))

## 12.0.5

### Patch Changes

- Fix `sku init` on Windows ([#833](https://github.com/seek-oss/sku/pull/833))

## 12.0.4

### Patch Changes

- Bump `eslint-config-seek` to `11.2.0` ([#830](https://github.com/seek-oss/sku/pull/830))

## 12.0.3

### Patch Changes

- Fix ESLint warning and error reporting ([#826](https://github.com/seek-oss/sku/pull/826))

## 12.0.2

### Patch Changes

- Ensure `sku pre-commit` lints the same files as `sku lint` ([#821](https://github.com/seek-oss/sku/pull/821))

## 12.0.1

### Patch Changes

- Check that paths exist before looking for `*.less` files in them ([#817](https://github.com/seek-oss/sku/pull/817))

## 12.0.0

### Major Changes

- Drop support for styling with [treat]. Please [migrate] styles to [Vanilla Extract]. ([#809](https://github.com/seek-oss/sku/pull/809))

  [treat]: https://seek-oss.github.io/treat/
  [migrate]: https://github.com/seek-oss/braid-design-system/blob/e42c6f9168904f6b607c74157cafebf9b0147489/docs/treat%20to%20vanilla-extract%20migration.md
  [Vanilla Extract]: https://vanilla-extract.style/documentation/getting-started

- Remove workaround for `classnames` package issue ([#803](https://github.com/seek-oss/sku/pull/803))

  A workaround for [a bug in the `classnames`][bug] package has been removed now that the bug has been fixed.

  Please evaluate whether you need to use `classnames` library in your app.
  Prefer using [Braid's `Box` component, which supports the full `clsx` API][box], instead.
  If you need to construct class name strings for components other than `Box`, prefer [the `clsx` package][clsx] over the `classnames` package.

  [bug]: https://github.com/JedWatson/classnames/issues/240
  [box]: https://seek-oss.github.io/braid-design-system/components/Box/#dynamic-css-classes
  [clsx]: https://github.com/lukeed/clsx

- `sku init` no longer installs and configures husky for you ([#804](https://github.com/seek-oss/sku/pull/804))

  BREAKING CHANGE

  `sku init` no longer adds `husky` as a dependecy nor does it configure husky for you out of the box.
  For instructions on how to set up `husky` to use sku's pre-commit hook, see [the docs].

  [the docs]: https://seek-oss.github.io/sku/#/./docs/extra-features?id=pre-commit-hook

- Support Storybook v7 ([#810](https://github.com/seek-oss/sku/pull/810))

  sku now supports Storybook v7. Please read [the Storybook migration guide] for a high-level overview of what has changed. For a more detailed list of changes, take a look at [the full migration notes].
  **NOTE**: Since sku installs and configures Storybook for you, a lot of the changes will not be relevant to users.

  **BREAKING CHANGE**

  As of Storybook v7, stories that use the `storiesOf` API will not work by default. The `storiesOf` API is deprecated and will be removed in Storybook v8, so it is highly encouraged to migrate your stories to the [Component Story Format (CSF)][csf].

  Migration can be done automatically via the migration tools provided by Storybook:

  ```sh
  npx storybook@7 migrate storiesof-to-csf --glob="src/**/*.stories.tsx"
  ```

  After doing this migration, your stories may need some manual cleanup to function correctly, such as adding [a default metadata export][meta].

  When your stories are working, you can also optionally migrate to the newer [CSF 3]:

  ```sh
  npx storybook@7 migrate csf-2-to-3 --glob="src/**/*.stories.tsx"
  ```

  If you cannot migrate your stories to CSF, or you need to dynamically generate stories with `storiesOf` (see [this issue][storiesof issue] for more info on the future of the `storiesOf` API), you can set the `storybookStoryStore` flag to `false` in your sku config:

  ```ts
  import { type SkuConfig } from 'sku';

  export default {
    storybookStoryStore: false,
  } satisfies SkuConfig;
  ```

  [the storybook migration guide]: https://storybook.js.org/docs/react/migration-guide#page-top
  [the full migration notes]: https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#from-version-65x-to-700
  [csf]: https://storybook.js.org/docs/react/api/csf
  [meta]: https://storybook.js.org/docs/react/api/csf#default-export
  [csf 3]: https://storybook.js.org/blog/storybook-csf3-is-here/
  [storiesof issue]: https://github.com/storybookjs/storybook/issues/9828#issuecomment-1370291568

- Drop support for [`seek-style-guide`] ([#803](https://github.com/seek-oss/sku/pull/803))

  BREAKING CHANGE

  `seek-style-guide` is no longer supported by sku. Flow support was already removed from sku in [v11], so
  any `seek-style-guide` components that use flow currently don't work with sku. However, there were remnants
  of `seek-style-guide` still present in sku's codebase. Specifically, import optimization and
  component mocking. These features have now been removed. Please migrate to [`braid-design-system`].

  [`seek-style-guide`]: https://github.com/seek-oss/seek-style-guide
  [v11]: https://github.com/seek-oss/sku/releases/tag/v11.0.0
  [`braid-design-system`]: https://seek-oss.github.io/braid-design-system/

- Require Node.js 18.12+ ([#805](https://github.com/seek-oss/sku/pull/805))

  **BREAKING CHANGE**

  Node 14 has already reached end of life as of April 2023, and Node.js 16 had its end of life date [brought forward to September 2023][node 16 eol], so in the interest of preventing another breaking change in 4 months time, we're pre-emptively dropping support for Node.js 16 in addition to Node.js 14.
  We've chosen to support Node.js versions from v18.12 onwards as this version was the first [Node.js 18 LTS release][node 18.12 release].

  Consider upgrading the Node.js version for your project across:

  - `.nvmrc`
  - `package.json#/engines/node`
  - `@types/node` package version
  - CI/CD configuration (`.buildkite/pipeline.yml`, `Dockerfile`, etc.)

  [node 16 eol]: https://nodejs.org/en/blog/announcements/nodejs16-eol
  [node 18.12 release]: https://nodejs.org/en/blog/release/v18.12.0

### Minor Changes

- Re-export all of `@storybook/react` ([#810](https://github.com/seek-oss/sku/pull/810))

  Previously, only specific APIs were re-exported under `sku/@storybook/react`. All APIs are now re-exported.

- Upgrade to TypeScript 5.0 ([#813](https://github.com/seek-oss/sku/pull/813))

  This major release includes breaking changes. See the [TypeScript 5.0 announcement][ts5] for more information.

  [ts5]: https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/

## 11.13.0

### Minor Changes

- Upgrade ESLint to v8 ([#814](https://github.com/seek-oss/sku/pull/814))

## 11.12.1

### Patch Changes

- Allow Webpack to interpret all `.mjs` files as modules, not just those from `node_modules` ([#811](https://github.com/seek-oss/sku/pull/811))

  This fixes an error with compiled Vocab translation files because Webpack would not parse `require.resolveWeak` in `.mjs` files.

- Bump Prettier to ensure parity with TypeScript and ESLint rules ([#808](https://github.com/seek-oss/sku/pull/808))

- Add warning banner about `.less` files ([#802](https://github.com/seek-oss/sku/pull/802))

## 11.12.0

### Minor Changes

- Add support for Storybook's `preview.js` file and re-export the `DecoratorFn` type from `@storybook/react` ([#792](https://github.com/seek-oss/sku/pull/792))

  sku now supports global customization of story rendering via a `.storybook/preview.(js|ts|tsx)` file.

  **EXAMPLE USAGE:**

  ```tsx
  import 'braid-design-system/reset';
  import apac from 'braid-design-system/themes/apac';
  import { BraidProvider } from 'braid-design-system';

  import React from 'react';
  import type { DecoratorFn } from 'sku/@storybook/react';

  // This will wrap every story in a BraidProvider
  export const decorators: DecoratorFn = [
    (Story) => (
      <BraidProvider theme={apac}>
        <Story />
      </BraidProvider>
    ),
  ];
  ```

  See [the Storybook docs][storybook preview.js] for more info.

  [storybook preview.js]: https://storybook.js.org/docs/react/configure/overview#configure-story-rendering

## 11.11.2

### Patch Changes

- Don't run postinstall script if a project isn't using sku ([#794](https://github.com/seek-oss/sku/pull/794))

## 11.11.1

### Patch Changes

- Check only directories for Storybook stories ([#797](https://github.com/seek-oss/sku/pull/797))

## 11.11.0

### Minor Changes

- Start sku dev server middleware when running storybook ([#787](https://github.com/seek-oss/sku/pull/787))

  When running `sku storybook`, if you have configured `devServerMiddleware` in your sku config, that middleware will now be passed through to storybook and injected into its own middleware stack.

## 11.10.1

### Patch Changes

- Lint all extensions supported by the ESLint config ([#784](https://github.com/seek-oss/sku/pull/784))

## 11.10.0

### Minor Changes

- Update Vocab libraries ([#781](https://github.com/seek-oss/sku/pull/781))

  The `@vocab/types` package has been absorbed into the `@vocab/core` package and the generated translation file will import types from the `@vocab/core` package instead.

  `@vocab/webpack/loader` has been updated to work with more file types (`.js`, `.cjs`, `.mjs`)

- Update to eslint-config-seek v11.0.0. ([#779](https://github.com/seek-oss/sku/pull/779))

  This version of the ESLint config adds additional rules enforcing consistent type imports/exports, as explained in [this article](https://typescript-eslint.io/blog/consistent-type-imports-and-exports-why-and-how/).

  Any reported errors can be auto-fixed with `sku format`.

## 11.9.2

### Patch Changes

- Fix a bug that could occur when running `sku build` or `sku build-ssr` that caused the copying of assets from the `public` folder to the `target` folder to fail ([#776](https://github.com/seek-oss/sku/pull/776))

## 11.9.1

### Patch Changes

- Fix a bug where a function that didn't exist was being called ([#774](https://github.com/seek-oss/sku/pull/774))

## 11.9.0

### Minor Changes

- Re-export `Meta` and `StoryObj` types from `@storybook/react` ([#773](https://github.com/seek-oss/sku/pull/773))

  The `Meta` and `StoryObj` types are now re-exported under `sku/@storybook/react`.

  These types are useful for typing [CSF 3 stories] which are the new recommended way of writing stories.

  **EXAMPLE USAGE**:

  ```ts
  import type { Meta } from 'sku/@storybook/react';

  import { MyComponent } from './MyComponent';

  const meta: Meta<typeof MyComponent> = {
    title: 'Path/To/MyComponent',
    component: MyComponent,
  };
  export default meta;

  type Story = StoryObj<typeof MyComponent>;

  export const Basic: Story = {};

  export const WithProp: Story = {
    render: () => <MyComponent prop="value" />,
  };
  ```

  [CSF 3 stories]: https://storybook.js.org/docs/react/api/csf

### Patch Changes

- Remove dependency on `fs-extra` ([#770](https://github.com/seek-oss/sku/pull/770))

- Update dependencies ([#768](https://github.com/seek-oss/sku/pull/768))

## 11.8.2

### Patch Changes

- start-ssr: Enable `devServerMiddleware` to serve static assets ([#765](https://github.com/seek-oss/sku/pull/765))

  Apply `devServerMiddleware` before sku static asset middleware, to support consumers serving custom static assets.

## 11.8.1

### Patch Changes

- Re-add `@types/jest` as a dependency ([#757](https://github.com/seek-oss/sku/pull/757))

## 11.8.0

### Minor Changes

- Add `libraryFile` configuration option ([#755](https://github.com/seek-oss/sku/pull/755))

  This option allows the file name of the library to be specified in the sku configuration.
  If this option is not specified then the `libraryName` option will be used for this purpose instead (note that this is the previously existing behaviour).

  **EXAMPLE USAGE**:

  ```typescript
  // sku.config.ts
  import type { SkuConfig } from 'sku';

  const skuConfig: SkuConfig = {
    libraryEntry: 'src/library.js',
    renderEntry: 'src/render.js',
    libraryName: 'MyAwesomeLibrary',
    libraryFile: 'my-awesome-library',
  };

  export default skuConfig;
  ```

## 11.7.2

### Patch Changes

- Fix a bug that broke root resolution within `.css.ts` files during tests ([#741](https://github.com/seek-oss/sku/pull/741))

## 11.7.1

### Patch Changes

- Update dependencies ([#724](https://github.com/seek-oss/sku/pull/724))

## 11.7.0

### Minor Changes

- Add `package.json` configuration flags that enable you to skip sku configuration and peer dep validation ([#727](https://github.com/seek-oss/sku/pull/727))

  **NOTE**: These settings disable critical functionality of sku, so you likely
  don't want to use them unless you know what you're doing

  - `skuSkipConfigure`: Skip generation of config files. E.g. .prettierrc, tsconfig.json, etc.
  - `skuSkipValidatePeerDeps`: Skip checking for multiple copies of the same package. You likely want to try and fix the warnings found by this check rather than disabling it.

  **EXAMPLE USAGE**:

  ```jsonc
  // package.json
  {
    "skuSkipConfigure": true,
    "skuSkipValidatePeerDeps": true
  }
  ```

## 11.6.2

### Patch Changes

- **deps**: `@pmmmwh/react-refresh-webpack-plugin@0.5.8` ([#716](https://github.com/seek-oss/sku/pull/716))

- Update to eslint-config-seek v10.1.1. Read the following release notes for all the changes: ([#718](https://github.com/seek-oss/sku/pull/718))

  - [v10.1.0] brings improved TypeScript support
  - [v10.1.1] re-enables the `no-undef` rule for JavaScript files

  [v10.1.0]: https://github.com/seek-oss/eslint-config-seek/releases/tag/v10.1.0
  [v10.1.1]: https://github.com/seek-oss/eslint-config-seek/releases/tag/v10.1.1

## 11.6.1

### Patch Changes

- Fix transpilation of typescript-specific class keywords ([#714](https://github.com/seek-oss/sku/pull/714))

## 11.6.0

### Minor Changes

- Update to eslint-config-seek v10 ([#709](https://github.com/seek-oss/sku/pull/709))

  This update involves a few major version jumps, so be sure to read the following release notes for all the breaking changes:

  - [v8.0.0](https://github.com/seek-oss/eslint-config-seek/releases/tag/v8.0.0)
  - [v9.0.0](https://github.com/seek-oss/eslint-config-seek/releases/tag/v9.0.0)
  - [v10.0.0](https://github.com/seek-oss/eslint-config-seek/releases/tag/v10.0.0)

  You should be able to automatically fix most lint warnings/errors by running `yarn sku format`.

- Upgrade from jest v27 to v29 ([#709](https://github.com/seek-oss/sku/pull/709))

  Please take a look at the following upgrade guides as there may be breaking changes that affect your tests:

  - [v27 to v28 upgrade guide](https://jestjs.io/docs/28.x/upgrading-to-jest28)
  - [v28 to v29 upgrade guide](https://jestjs.io/docs/upgrading-to-jest29)

  Likely the most significant change is the new default snapshot format:

  ```diff
  - Expected: \\"a\\"
  + Expected: "a"

  - Object {
  -   Array []
  - }
  + {
  +   []
  + }
  ```

  This may require you to update your snapshots.

- Drop support for Node v12 ([#709](https://github.com/seek-oss/sku/pull/709))

  Sku now only supports Node v14.15 and above.
  Although sku itself does not depend on any Node v14 APIs, Node v12 is [no longer officially supported](https://github.com/nodejs/Release#end-of-life-releases), and many of sku's dependencies no longer support it either.
  Please ensure you are using a supported version of Node both locally (e.g. via a `.nvmrc` file) and in CI (check your Docker images).

- Update typescript dependency ([#709](https://github.com/seek-oss/sku/pull/709))

  Sku now has a `typescript` dependency of `^4.5.0`.
  Previously the version was restricted due to a type issue with `braid-design-system` and `typescript@4.5.0`.
  Please take a look at the release notes for recent typescript versions as there may be breaking changes that need to be addressed.

### Patch Changes

- Close `sku start` dev server properly on `SIGINT` ([#706](https://github.com/seek-oss/sku/pull/706))

- Update deps ([#706](https://github.com/seek-oss/sku/pull/706))

## 11.5.0

### Minor Changes

- Add optional `delete-unused-keys` flag to the `translations push` command ([#702](https://github.com/seek-oss/sku/pull/702))

  If this flag is set, unused keys will be deleted from Phrase after translations are pushed.

  ```bash
  sku translations push --delete-unused-keys
  ```

### Patch Changes

- Display a better error message when no `sku translations` command is provided ([#702](https://github.com/seek-oss/sku/pull/702))

## 11.4.5

### Patch Changes

- Roll back typescript version to one that doesn't break vanilla types ([#698](https://github.com/seek-oss/sku/pull/698))

## 11.4.4

### Patch Changes

- Series of small fixes ([#696](https://github.com/seek-oss/sku/pull/696))
  - Update the SkuConfig type to accept `ReadonlyArray`s, to allow for passing in of `as const` arrays.
  - Allowed TypeScript versions newer than 4.5. There were issues in 4.5 that broke vanilla-extract and braid, that have been fixed in 4.6.
  - Updated the `lib` of tsconfig to `es2019`, to allow access to all that flatMappy goodness.

## 11.4.3

### Patch Changes

- Update deps ([#692](https://github.com/seek-oss/sku/pull/692))

## 11.4.2

### Patch Changes

- Allow `:` to be used in dynamic paths again. ([#687](https://github.com/seek-oss/sku/pull/687))

  Previously, dynamic paths were declared using the standard `:param` syntax, but this had been deprecated in favour of `$param`.

  This has now been updated to allow for both.
  This should allow `sku serve` to work for projects using colon syntax.

## 11.4.1

### Patch Changes

- init: Refresh the next steps page ([#688](https://github.com/seek-oss/sku/pull/688))

  Uplift the design (subjective) of the next steps page and add links to more useful content for fresh projects. Includes `Vocab` and slack channels for support and release announcements.

- React 18 support ([#688](https://github.com/seek-oss/sku/pull/688))

## 11.4.0

### Minor Changes

- The `languages` sku config value now accepts `readonly` types ([#685](https://github.com/seek-oss/sku/pull/685))

## 11.3.3

### Patch Changes

- Exclude playroom from vanilla-extract pipeline ([#682](https://github.com/seek-oss/sku/pull/682))

  TL;DR Only affects consumers using running Playroom along side sku — i.e. Braid.

  Due to the current pattern used for the virtual file paths of vanilla-extract's generated stylesheets, we are manually excluding Playroom’s vanilla-extract styles.

  In the future, we are planning to use more realistic virtual file paths, which should honour the default handling of include/exclude path matching and make this work around no longer necessary.

## 11.3.2

### Patch Changes

- Fix banner width in CI ([#680](https://github.com/seek-oss/sku/pull/680))

## 11.3.1

### Patch Changes

- test: Run Jest using the CI flag when in CI environment ([#678](https://github.com/seek-oss/sku/pull/678))

  Tests run in CI should fail if a new snapshot is written, this was not the case and needed to be opted into manually by passing the `--ci` [flag to Jest](https://jestjs.io/docs/cli#--ci).

## 11.3.0

### Minor Changes

- Any app that configures `languages` will automatically have the `en-PSEUDO` language generated for them. ([#675](https://github.com/seek-oss/sku/pull/675))
  `en-PSEUDO` is a generated language created by pseudo-localizing existing `en` translation messages in your app.
  An explanation of the pseudo-localization process, as well as possible use cases for this language, can be found in [the Vocab docs].

  `en-PSEUDO` can be consumed just like any other language in your app:

  ```jsx
  const App = () => <VocabProvider language="en-PSEUDO">...</VocabProvider>;
  ```

  **NB:** Statically-rendered apps will not be able to render an `en-PSEUDO` version of their app at build time.
  If this is a use case that you would find useful, please reach out in #sku-support.

  [the vocab docs]: https://github.com/seek-oss/vocab#pseudo-localization

## 11.2.8

### Patch Changes

- Force upgrade `@vocab/core` to `^1.0.4` to fix a language hierarchy bug that can result in incorrect translation messages being used for a language. ([#672](https://github.com/seek-oss/sku/pull/672))

## 11.2.7

### Patch Changes

- Support static rendering for routes using ':language' ([#670](https://github.com/seek-oss/sku/pull/670))

## 11.2.6

### Patch Changes

- Add "extends" to languages type definition ([#668](https://github.com/seek-oss/sku/pull/668))

## 11.2.5

### Patch Changes

- Fix missing import for resolve modules ([#666](https://github.com/seek-oss/sku/pull/666))

## 11.2.4

### Patch Changes

- Ensure compile packages within nested node_modules are transformed in jest ([#664](https://github.com/seek-oss/sku/pull/664))

- Include `@babel/runtime` in render builds to ensure it is importable ([#664](https://github.com/seek-oss/sku/pull/664))

## 11.2.3

### Patch Changes

- Prevents typescript from being upgraded to 4.5.x ([#662](https://github.com/seek-oss/sku/pull/662))

  Typescript 4.5 has caused a lot of issues with packages included with sku (braid, vanilla-extract) that are caused by a regression that's been introduced in the type checker.
  It seems to be fixed in 4.6.0-dev, but that won't be available until late February.

  To prevent things blowing up in the meantime, the version of typescript has been update to keep it below 4.5, at least until a patch is released in 4.5

## 11.2.2

### Patch Changes

- The autogenerated tsconfig.json no longer explicitly excludes `node_modules` ([#660](https://github.com/seek-oss/sku/pull/660))

## 11.2.1

### Patch Changes

- Fix loading of TS config files that use node builtins or external dependencies. ([#657](https://github.com/seek-oss/sku/pull/657))

## 11.2.0

### Minor Changes

- Config files can now be in TypeScript ([#655](https://github.com/seek-oss/sku/pull/655))

  Previously, projects were configured using a `sku.config.js` file, which exported a config object.
  As most projects at SEEK are now TypeScript based, having a JS config file makes it impossible to reuse any of your production code in the config (e.g. routes).

  This change makes it possible to use a TypeScript config file, by default `sku.config.ts`.
  The easiest way to migrate is to change the module exports to a default export:

  ```diff
  - // sku.config.js
  + // sku.config.ts
  - module.exports = {
  + export default {
    clientEntry: 'src/client.tsx',
    // ...
  }
  ```

  But sku also now exports a type for the config object, to make it easier to setup and understand the configuration options.

  ```diff
  + import type { SkuConfig } from 'sku';
  +
  - module.exports = {
  + const config: SkuConfig = {
    clientEntry: 'src/client.tsx',
    // ...
  }
  +
  + export default config;
  ```

  `sku init` will now create TypeScript config files by default.

### Patch Changes

- Ensure translations are available when running storybook ([#638](https://github.com/seek-oss/sku/pull/638))

## 11.1.0

### Minor Changes

- Include node_modules in node builds ([#651](https://github.com/seek-oss/sku/pull/651))

  Previously, sku would only compile code within your src folder, plus any compile packages, for builds targetting the node environment. While this results in faster builds, it can sometimes lead to incorrect versions of packages being resolved due to clashing version range requirements. All node_modules will now included in the compilation by default, ensuring the correct package version is always required.

  The old behaviour can be re-enabled via the new `externalizeNodeModules` config.

## 11.0.4

### Patch Changes

- Correct exclusion of `removeViewBox` svgo plugin ([#647](https://github.com/seek-oss/sku/pull/647))

## 11.0.3

### Patch Changes

- Run `@vanilla-extract/webpack-plugin` in node builds to ensure class name consistency ([#640](https://github.com/seek-oss/sku/pull/640))

- Update `@vanilla-extract/webpack-plugin` to v2.0.0 ([#640](https://github.com/seek-oss/sku/pull/640))

## 11.0.2

### Patch Changes

- Run babel transform-runtime in development ([#636](https://github.com/seek-oss/sku/pull/636))

  This fixes an issue where the `regeneratorRuntime` is required to be setup manually only for development.

## 11.0.1

### Patch Changes

- Re-introduce lint rules requiring React import when using JSX ([#631](https://github.com/seek-oss/sku/pull/631))

  As sku v11 moved to the new [JSX transform](https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html), we removed all lint rules ensuring `React` was imported when using JSX. Unfortunately this change only works if all compile packages (e.g. braid-design-system) switch to sku v11 at the same time, which would also constitute a breaking change. To avoid a lot of package update churn, we are re-introducing the need for `React` imports when JSX is present.

- Update svgo config to remove deprecated "extendDefaultPlugins" utility. ([#632](https://github.com/seek-oss/sku/pull/632))

  This requires svgo@2.4.0, so `Unknown builtin plugin "preset-default" specified` errors can be fixed by refreshing the lockfile.

## 11.0.0

### Major Changes

- Remove `sku chromatic` script ([#629](https://github.com/seek-oss/sku/pull/629))

  Due to changes in the way chromatic is setup, it now makes more sense for consumers to integrate with chromatic directly.

  MIGRATION GUIDE

  Follow the [chromatic install step](https://www.chromatic.com/docs/setup#install).

  Once installed, you can setup CI as follows

  ```bash
  yarn sku build-storybook
  yarn chromatic --storybook-build-dir dist-storybook
  ```

  Your `storybook-build-dir` is whatever you configured your `storybookTarget` as in `sku.config.js`. The default is `dist-storybook`.

  BREAKING CHANGE

  `sku chromatic` script is no longer available.

- Rename the `SkuWebpackPlugin` option `supportedBrowsers` to `browserslist` ([#629](https://github.com/seek-oss/sku/pull/629))

  The `SkuWebpackPlugin` now uses the [browserslist query](https://github.com/browserslist/browserslist) as a compile target for Node code as well.

  BREAKING CHANGE

  If you are consuming the `SkuWebpackPlugin` directly, update uses of `supportedBrowsers` to use `browserslist` instead. If compiling for Node, ensure you pass a valid Node [browserslist query](https://github.com/browserslist/browserslist) (e.g. `current node`).

- Remove `sku playroom` and `sku build-playroom` ([#629](https://github.com/seek-oss/sku/pull/629))

  BREAKING CHANGE

  All playroom scripts have been removed in favour of consumers installing [playroom](https://github.com/seek-oss/playroom) directly. If you'd like to continue using playroom then you can use the [SkuWebpackPlugin](https://seek-oss.github.io/sku/#/./docs/custom-builds).

  Example config:

  ```js
  // playroom.config.js
  const SkuWebpackPlugin = require('sku/webpack-plugin');
  const MiniCssExtractPlugin = require('mini-css-extract-plugin');

  module.exports = {
    components: './src/components',
    outputPath: './dist/playroom',

    webpackConfig: () => ({
      plugins: [
        new MiniCssExtractPlugin(),
        new SkuWebpackPlugin({
          include: paths.src,
          target: 'browser',
          browserslist: ['last 2 chrome versions'],
          mode: 'development',
          displayNamesProd: true,
          removeAssertionsInProduction: false,
          MiniCssExtractPlugin,
        }),
      ],
    }),
  };
  ```

- Remove support for `seek-asia-style-guide` ([#629](https://github.com/seek-oss/sku/pull/629))

  As `seek-asia-style-guide` is no longer used, first class support for it has been removed.

- Upgrade to webpack 5 ([#629](https://github.com/seek-oss/sku/pull/629))

  All start and build scripts, including storybook will now use webpack 5. Along with the webpack upgrade a lot of other related dependencies have been updated.

  MIGRATION GUIDE

  While there is no breaking change from a sku perspective, there are many underlying changes that may require attention.

  Things to validate before merging:

  - If you use `dangerouslySetWebpackConfig`, check it's working against webpack 5
  - Static assets are working correctly (e.g. images, fonts, etc)
  - Both start and build scripts are outputting a working application

  If you are seeing errors mentioning polyfills after upgrading it's likely your app is relying on [automatic NodeJS polyfills](https://webpack.js.org/blog/2020-10-10-webpack-5-release/#automatic-nodejs-polyfills-removed) which were removed in Webpack 5. Reach out in `#sku-support` if you're seeing this to discuss options.

  [Webpack 5 migration guide](https://webpack.js.org/migrate/5)

  [Webpack 5 release notes](https://webpack.js.org/blog/2020-10-10-webpack-5-release/)

- Add persistentCache option and enable by default ([#629](https://github.com/seek-oss/sku/pull/629))

  The new `persistentCache` option will turn on webpack's filesystem caching between runs of `sku start` and `sku start-ssr`. This should result in much faster dev server start times when the cache is vaild.

  BREAKING CHANGE

  Unfortunately treat files are not compatible with the `persistentCache` option, so it will need to be disabled in your project until you have migrated them to Braid components or `.css.ts` files.

  ```js
  // sku.config.js
  module.exports = {
    persistentCache: false,
  };
  ```

  > This limitation only applies to files inside the current project, any treat files within node_modules can be safely ignored.

- Update the minimum supported Node version to 12.13.0 ([#629](https://github.com/seek-oss/sku/pull/629))

  BREAKING CHANGE

  Node 10 is no longer supported

- Remove `test-ssr` command ([#629](https://github.com/seek-oss/sku/pull/629))

  BREAKING CHANGE

  The `sku test-ssr` command is no longer available. Please use `sku test` instead.

- Switch to the `automatic` JSX React runtime ([#629](https://github.com/seek-oss/sku/pull/629))

  > This feature was patched in v11.0.1, ensure you are using at least v11.0.1.

  This changes how JSX is transformed into valid JavaScript and comes with some performance benefits. [Read more about the change here](https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html).

  **MIGRATION GUIDE**

  Ensure your app is running React 17. React 16.14 is also supported if required.

  **BREAKING CHANGE**

  The minimum supported version of React is now `v16.14.0`.

- Upgrade to Jest 27 ([#629](https://github.com/seek-oss/sku/pull/629))

  Jest 27 introduces a bunch of new default settings, primarily switching the default test environment from `jsdom` to `node`. However, sku will remain using `jsdom` by default as we feel it makes more sense as a default for UI development. You can read through the [Jest 27 release post](https://jestjs.io/blog/2021/05/25/jest-27) to see the other breaking changes that have occured.

- Remove support for flow ([#629](https://github.com/seek-oss/sku/pull/629))

  Files using [flow types](https://flow.org/) are no longer supported. Any remaining flow types should be migrated to TypeScript.

- Remove `@storybook/addon-knobs` in favor of allowing custom addons. ([#629](https://github.com/seek-oss/sku/pull/629))

  MIGRATION GUIDE

  If you still require the use of `@storybook/addon-knobs` you'll first need to install it.

  **Note**: `@storybook/addon-knobs` has been deprecated in favor of `@storybook/addon-controls`.

  ```bash
  yarn add --dev @storybook/addon-knobs
  ```

  Once installed, inside your `sku.config.js` file, pass `@storybook/addon-knobs` to the `storybookAddons` option.

  ```js
  // sku.config.js
  module.exports = {
    storybookAddons: ['@storybook/addon-knobs'],
  };
  ```

- Add `webpackStats.json` to `build-ssr` output ([#629](https://github.com/seek-oss/sku/pull/629))

  Running `sku build-ssr` will now output a `webpackStats.json` alongside the `server.js` file which is required to be deployed to the same directory as `server.js`.

  BREAKING CHANGE

  SSR applications must now deploy the `webpackStats.json` alongside the `server.js` file.

### Minor Changes

- Add `storybookAddons` config option ([#629](https://github.com/seek-oss/sku/pull/629))

  Custom storybook addons can now be used via the `storybookAddons` config option. For example, if you want to use `@storybook/addon-essentials`, first install the addon.

  ```bash
  yarn add --dev @storybook/addon-essentials
  ```

  Then add it to your `sku.config.js`.

  ```js
  // sku.config.js
  module.exports = {
    storybookAddons: ['@storybook/addon-essentials'],
  };
  ```

- Add `--stats` argument ([#629](https://github.com/seek-oss/sku/pull/629))

  You can now override the default webpack stats preset via the `--stats` option. This is useful for debugging warnings and build issues. You can pass any valid [webpack stats preset](https://webpack.js.org/configuration/stats/#stats-presets).

  ```bash
  sku start --stats errors-warnings
  ```

  The default values are as follows:

  **start/start-ssr**: `summary`

  **build/build-ssr**: `errors-only`

- Move to faster source maps setting in development ([#629](https://github.com/seek-oss/sku/pull/629))

  Previously sku used `inline-source-map` in development which is very slow, particularly for rebuilds. Development source maps now use `eval-cheap-module-source-map`.

- Upgrade to storybook 6 ([#629](https://github.com/seek-oss/sku/pull/629))

## 10.14.2

### Patch Changes

- Fix incorrect "Invalid script passed to 'registerScript'" errors ([#614](https://github.com/seek-oss/sku/pull/614))

## 10.14.1

### Patch Changes

- Fix static rendering of vanilla-extract classes in production ([#610](https://github.com/seek-oss/sku/pull/610))

## 10.14.0

### Minor Changes

- Upgrade to Prettier 2.3 ([#606](https://github.com/seek-oss/sku/pull/606))

  This will require consumers to run `yarn format` to adopt the new Prettier rules. To reduce the mismatch of prettier versions in the future we are unpinning sku's required version, allowing consumers to relock and accept minor and patch updates.

## 10.13.4

### Patch Changes

- Fix Date `instanceof` checks inside render ([#604](https://github.com/seek-oss/sku/pull/604))

## 10.13.3

### Patch Changes

- Group `.css.ts` files with styles when ordering imports ([#600](https://github.com/seek-oss/sku/pull/600))

- Work around a [classnames bug](https://github.com/JedWatson/classnames/issues/240) where dynamic class objects are converted to `[Object object]` during static render ([#602](https://github.com/seek-oss/sku/pull/602))

- Update minimum playroom version ([#600](https://github.com/seek-oss/sku/pull/600))

## 10.13.2

### Patch Changes

- Correctly handle image imports in .css.ts files ([#598](https://github.com/seek-oss/sku/pull/598))

## 10.13.1

### Patch Changes

- Update vanilla-extract to v1 ([#593](https://github.com/seek-oss/sku/pull/593))

- Remove deprecated Braid components from `sku init` template ([#595](https://github.com/seek-oss/sku/pull/595))

## 10.13.0

### Minor Changes

- Add `skipPackageCompatibilityCompilation` option ([#591](https://github.com/seek-oss/sku/pull/591))

  When running `sku build`, sku will compile all your external packages (`node_modules`) through `@babel/preset-env`. This is to ensure external packages satisfy the browser support policy. However, this can cause very slow builds when large packages are processed. The `skipPackageCompatibilityCompilation` option allows you to pass a list of trusted packages to skip this behaviour.

  > Note: `react` & `react-dom` are skipped by default.

  Example:

  ```js
  const config = {
    skipPackageCompatibilityCompilation: [
      '@bloat/very-large-package',
      'lodash',
    ],
  };
  ```

## 10.12.2

### Patch Changes

- Remove cssnano `calc` optimization ([#589](https://github.com/seek-oss/sku/pull/589))

## 10.12.1

### Patch Changes

- Exclude vanilla-extract CSS files from Storybook's webpack config ([#587](https://github.com/seek-oss/sku/pull/587))

## 10.12.0

### Minor Changes

- Add support for @vanilla-extract ([#583](https://github.com/seek-oss/sku/pull/583))

  Note: This is not yet intended for use in production.

## 10.11.0

### Minor Changes

- Add the ability to limit languages to render by route ([#581](https://github.com/seek-oss/sku/pull/581))

## 10.10.1

### Patch Changes

- Fix errors initializing repo after kopy dependency upgrade ([#578](https://github.com/seek-oss/sku/pull/578))

## 10.10.0

### Minor Changes

- Stable support for multi-language functionality ([#576](https://github.com/seek-oss/sku/pull/576))

  With Vocab now released v1.0.0 we now offer stable support for using the new multi-language functionality.

  See [multi-language support guide](https://seek-oss.github.io/sku/#/./docs/multi-language) for how to get started.

### Patch Changes

- Fix unable to find language in URLs that contain query parameters ([#573](https://github.com/seek-oss/sku/pull/573))

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
