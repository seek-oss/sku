---
'sku': patch
---

`build|start (vite)`: Handle Vanilla Extract styles from packages that ship source code

If you were using `dangerouslySetViteConfig` to exclude packages from `optimizeDeps` to work around this, you can now remove that configuration along with any of its CommonJS dependencies listed in `optimizeDeps.include`.
