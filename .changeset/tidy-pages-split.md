---
'sku': major
---

Enable `distSubfolders` by default

**BREAKING CHANGE**

`distSubfolders` now defaults to `true`.
Build output is split into subfolders instead of being written to the root of `dist`.

See the [`distSubfolders`](https://seek-oss.github.io/sku/docs/configuration#distsubfolders) docs for more details.

If you deploy your app with a static site deployment tool, you may need to update its settings to match the new output structure.
If you use a SEEK-managed deployment package, upgrade to a version that supports it.
