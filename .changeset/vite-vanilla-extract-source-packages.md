---
'sku': patch
---

`build|start (vite)`: Vanilla extract styles from source-shipping packages are now picked up automatically.

If you were using `dangerouslySetViteConfig` to exclude packages from `optimizeDeps` to work around this, you can now remove that configuration along with any of its CommonJS dependencies listed in `optimizeDeps.include`.
