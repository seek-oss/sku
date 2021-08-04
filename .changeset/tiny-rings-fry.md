---
'sku': major
---

Add `webpackStats.json` to `build-ssr` output

Running `sku build-ssr` will now output a `webpackStats.json` alongside the `server.js` file which is required to be deployed to the same directory as `server.js`.

BREAKING CHANGE

SSR applications must now deploy the `webpackStats.json` alongside the `server.js` file.