---
'sku': patch
---

`vite`: Improve compatibility with `@apollo/client` v3 and v4

CJS interop for `@apollo/client` is now applied conditionally depending on both the major version and the `sku` command being executed.
