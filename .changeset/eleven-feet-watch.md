---
'sku': major
---

Rename the `SkuWebpackPlugin` option `supportedBrowsers` to `browserslist`

The `SkuWebpackPlugin` now uses the [browserslist query](https://github.com/browserslist/browserslist) as a compile target for Node code as well.

BREAKING CHANGE

If you are consuming the `SkuWebpackPlugin` directly, update uses of `supportedBrowsers` to use `browserslist` instead. If compiling for Node, ensure you pass a valid Node [browserslist query](https://github.com/browserslist/browserslist) (e.g. `current node`).