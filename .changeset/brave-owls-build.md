---
'sku': major
---

Change the default `bundler` to `vite`

**BREAKING CHANGE**

`bundler` now defaults to `'vite'` instead of `'webpack'`.
Apps that don't set `bundler` will build and serve with Vite.

Webpack-only options, such as `dangerouslySetWebpackConfig`, `srcPaths` and `serverPort`, now cause a type error unless the config sets `bundler: 'webpack'`.

Library mode is only supported with webpack.
`libraryEntry`, `libraryName` and `libraryFile` are now only available on the webpack config type, and config validation fails when `libraryEntry` is used without `bundler: 'webpack'`.
