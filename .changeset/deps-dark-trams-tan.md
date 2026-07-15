---
'sku': patch
---

`deps`: Unpin `webpack-dev-server` dependency

[`webpack-dev-server@5.2.1`] changed dev server behaviour to be more secure when handling cross-origin requests. This resulted in CORS errors in sku SSR apps during local development. The `webpack-dev-server` dependency version was restricted to older versions in `sku@14.8.0` to temporarily mitigate this issue.

This issue has now been resolved, and the dependency has been unpinned. SSR consumers that were overriding `webpack-dev-server` to a specific version in their `package.json` should now be able to remove such restrictions.

[`webpack-dev-server@5.2.1`]: https://github.com/webpack/webpack-dev-server/releases/tag/v5.2.1
[`sku@14.8.0`]: https://github.com/seek-oss/sku/releases/tag/sku%4014.8.0

