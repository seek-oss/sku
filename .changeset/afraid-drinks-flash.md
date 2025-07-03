---
'sku': patch
---

Modify `webpack-dev-server` dependency range to `<=5.2.0`

[`webpack-dev-server@5.2.1`][wds release] introduced a CORS change that can break local development in some cases. Although 5.2.2 allegedly addresses this issue, it did not fix the issue in `sku`. Until a proper fix is available, we are pinning the version to `<=5.2.0` to prevent the dependency from being updated during lockfile maintenance.

[wds release]: https://github.com/webpack/webpack-dev-server/releases/tag/v5.2.1
