---
'sku': minor
---

`webpack`: Add support for Vite-style query parameters when importing SVG files

To support migration from webpack to Vite, SVG imports in webpack now support the same `raw`, `inline` and `url` query parameters as Vite. This allows you to specify how the SVG should be imported: as a raw string, a base64 data URL, or an asset URL. See [the image asset docs] for more information.

If your application is still using webpack, it is recommended to run the following codemod to automatically migrate all SVG imports to use the `raw` query parameter:

```sh
pnpm dlx @sku-lib/codemod svg-import-query-param .
```

This will ensure consistent SVG import behaviour when the time comes to migrate your application to Vite. The `url` and `inline` query parameters can also be used, however they aren't a drop-in replacement for the existing import behaviour (i.e. without any query paramters).

[the image asset docs]: https://seek-oss.github.io/sku/#/./docs/extra-features?id=importing-image-assets
