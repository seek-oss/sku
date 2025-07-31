---
'@sku-lib/vitest': patch
'sku': patch
---

`vitest`: Honour watch mode when running `sku test`

Previously it was not possible to run Vitest in watch mode via `sku test`. `sku test` should now behave similarly to [the `vitest` CLI][vitest cli], so `sku test`, `sku test watch` and `sku test -w/--watch` will all trigger watch mode.

To run tests once and exit, you can execute `sku test run`, `sku test --run` or `sku test --no-watch` .

[vitest cli]: https://vitest.dev/guide/cli
