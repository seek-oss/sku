---
'sku': major
---

`webpack`: Replace `cssnano` with `lightningcss` for CSS minification

Both Webpack and Vite apps now use `lightningcss` for CSS minification.

The structure of minified CSS output by webpack apps has changed, though the resulting styles should be unaffected. We recommend testing a production build to confirm.
