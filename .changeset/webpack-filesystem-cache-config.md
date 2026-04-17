---
'sku': minor
---

`webpack`: Add `webpackFilesystemCache` so production builds (`sku build` / `sku build-ssr`) and CI can opt in to Webpack filesystem caching.

Accepts either a mode (`'development' | 'always'`) or an options object exposing Webpack's [advanced cache options](https://webpack.js.org/guides/caching/#advanced-options) (`compression`, `maxAge`, extra `buildDependencies`). Sku always invalidates the cache when `sku.config.*` or the installed `sku` version changes. Override the mode with `SKU_WEBPACK_FILESYSTEM_CACHE`. Default remains `'development'` (cache only for the local dev server).
