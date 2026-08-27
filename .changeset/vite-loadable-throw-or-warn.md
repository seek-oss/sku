---
'sku': patch
---

`build|start (vite)`: Fail `sku build` when a `sku/@loadable/component` import remains in the module graph, and warn on `sku start`

Webpack loadable imports now warn on `sku start` and fail `sku build`, whether or not `--convert-loadable` is set. The flag still converts default imports to `@sku-lib/vite/loadable`; any leftover (e.g. `loadableReady`) must be removed manually. Previously these imports were only logged on `sku start` for app source, potentially letting unsupported code ship to production.
