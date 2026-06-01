---
'sku': patch
---

Add `babel-polyfill`, `node-fetch` and `url-search-params-polyfill` to list of unnecessary polyfills

These polyfill dependencies are unnecessary given sku's browser support policy. Warnings will now be logged if they are detected. To address these warnings uninstall the dependencies and remove all references to them from your application.
