---
'sku': minor
---

Change output behaviour of `sku build` with `vite` as the bundler. All asset files now get added directly to the `dist` folder instead of being nested.
Change `publicPath` behaviour in the `sku.config` for `sku build` with `vite`. The given value now prepends itself to the `href` and `src` attributes of assets in the `index.html` file.
