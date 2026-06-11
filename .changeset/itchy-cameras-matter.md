---
'sku': major
---

`start-ssr`: Unpin `webpack-dev-server` dependency

This fixes CORS errors caused by recent changes in `webpack-dev-server`. SSR consumers that were previously pinning/resolving `webpack-dev-server` to a specific version should now be able to undo such restrictions and resolve it transitively `sku`.

**BREAKING CHANGE**:

Static assets are now hosted via the webpack dev server and document requests are proxied to the SSR server. TODO: what is the actual breaking change here?
