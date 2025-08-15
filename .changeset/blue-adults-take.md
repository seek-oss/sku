---
'sku': minor
---

This release improves support for the experimental Vite bundler, enabling full sku config parity with the Webpack bundler. This is a big step forward for the Vite bundler, bringing us closer to taking it out of experimental mode.

### React 19 support

Sku now has React 19 support, while still supporting React 18.

### Vite bundler improvements

- Explicitly deny commands unsupported by the vite bundler.

  Static site generation is our primary focus for the Vite bundler at this time, so SSR commands (`start-ssr`, `build-ssr`) with the experimental Vite bundler will now throw an error. Disable the experimental vite mode to continue using sku in SSR apps.

- `config`: The vite bundler now has full support for all sku static-site config properties. (library mode and ssr mode is not supported.)

- `config`: Add `pathAliases` configuration for custom import paths with Vite bundler.

- `build`: Bundle analysis reports are now generated for Vite builds in the `/report/` directory. This matches the behaviour of the Webpack bundler.

- `start`: Inline Vanilla Extract CSS to fix flash of unstyled text.

### `sku init`

- Dependencies will now correctly be pinned when running `sku init` in PNPM workspaces.

- Populate `packageManager` field in `package.json` if the new app is at the repo root.

- Install PNPM config dependency when PNPM is detected as the package manager.

- Specify an exact version of `sku` when installing dependencies.

  This fixes an issue where running `sku init` with a snapshot version of `sku` would install the latest version of `sku` instead of the specified version.

### `sku configure`

- Suggest recommended configuration changes for PNPM applications.

  During configuration, `sku` will conditionally output warning logs that suggest users make the following changes:
  - migrate `.npmrc` configuration to `pnpm-workspace.yaml`
  - update PNPM to at least v10.13.0
  - delete top-level `node_modules` and install the `pnpm-plugin-sku` [config dependency] via `pnpm add --config pnpm-plugin-sku && pnpm install`

  Applying all of these changes will suppress these warnings.

  The combination of these three changes will ensure PNPM hoists dependencies necessary for a smooth development experience across all IDEs, and runs necessary post-install scripts for some of `sku`'s dependencies. The [config dependency] in particular enables `sku` to effectively manage any future configuration changes that are necessary to ensure PNPM applications function correctly.

  [config dependency]: https://pnpm.io/config-dependencies

### General improvements

- `config`: The `SkuConfig` type has better type safety for webpack and vite options.

  When using `__experimental__bundler: 'vite'`, the `SkuConfig` type will be more strict, and will not allow you to use any properties that are not supported by the Vite bundler.

- `start`: Don't emit telemetry when `OPEN_TAB=false` is set.

- `test`: Fixes a bug where project configuration and Vocab translation compilation were running twice instead of once.

- `deps`: Replace `didyoumean2` dependency with `fastest-levenshtein`
