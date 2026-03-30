---
'sku': patch
---

`vite`: Align asset inline limit with webpack

To align with sku's webpack config, image assets imported in a Vite app that are smaller than 10,000 bytes will now be inlined as base64-encoded [`data` URLs](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Schemes/data). Previously the limit was 4,096 bytes.
