# @sku-lib/vitest

## 0.1.1

### Patch Changes

- Experimental vite bundler now requires vite v7. ([#1346](https://github.com/seek-oss/sku/pull/1346))

  This is a breaking peer dependency change for projects that use the experimental vite bundler. Since this is an experimental feature, we are not bumping the major version.

- - `vitest`: Honour watch mode when running `sku test` ([#1325](https://github.com/seek-oss/sku/pull/1325))

    Previously it was not possible to run Vitest in watch mode via `sku test`. `sku test` should now behave similarly to [the `vitest` CLI][vitest cli], so `sku test`, `sku test watch` and `sku test -w/--watch` will all trigger watch mode.

    To run tests once and exit, you can execute `sku test run`, `sku test --run` or `sku test --no-watch` .

    [vitest cli]: https://vitest.dev/guide/cli

  - `deps` Bump peer dependencies to support React 19

## 0.1.0

### Minor Changes

- Initial release. ([#1273](https://github.com/seek-oss/sku/pull/1273))
