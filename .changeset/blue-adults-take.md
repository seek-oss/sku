---
'sku': minor
---

This release improves support for the experimental Vite bundler, enabling full sku config parity with the Webpack bundler. This is a big step forward for the Vite bundler, bringing us closer to taking it out of experimental mode.

### React 19 support

Sku now has React 19 support, while still supporting React 18. _React 18 support will be removed in the next major release._

### SkuConfig feature parity

- The `SkuConfig` type has better type safety for webpack and vite options.

  When using `__experimental__bundler: 'vite'`, the `SkuConfig` type will be more strict, and will not allow you to use any properties that are not supported by the Vite bundler.

- Explicitly deny commands unsupported by the vite bundler

  Static site generation is our primary focus for the Vite bundler at this time, so SSR commands (`start-ssr`, `build-ssr`) with the experimental Vite bundler will now throw an error. Disable the experimental vite mode to continue using sku in SSR apps.

- Add vite bundler support for the following properties:
  - `displayNameProd`

  - `polyfills`

  - `target`

  - `sourceMapsProd`

  - `supportedBrowsers`

### build

- Bundle analysis reports are now generated for Vite builds in the `/report/` directory. This matches the behaviour of the Webpack bundler.

### start

`vite start`: Inline Vanilla Extract CSS to fix flash of unstyled text

`start`: Don't emit telemetry when `OPEN_TAB=false` is set

### init

`init`: dependencies will now correctly be pinned in workspaces

`init`: Populate `packageManager` field in `package.json` if the new app is at the repo root

`sku init`: Install PNPM config dependency when PNPM is detected as the package manager

`sku init`: Specify an exact version of `sku` when installing dependencies

This fixes an issue where running `sku init` with a snapshot version of `sku` would install the latest version of `sku` instead of the specified version.

### test

`sku test`: Fixes a bug where project configuration and Vocab translation compilation were running twice instead of once
