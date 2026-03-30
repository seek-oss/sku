---
'sku': minor
---

`webpack`: Add support for Vite-style query parameters when importing SVG files

To support migration from webpack to Vite, SVG imports in webpack now support the same `raw`, `inline` and `url` query parameters as Vite. This allows you to specify how the SVG should be imported: as a raw string, a base64 data URL, or an asset URL. See [the image asset docs] for more information.

[the image asset docs]: https://seek-oss.github.io/sku/#/./docs/extra-features?id=importing-image-assets
