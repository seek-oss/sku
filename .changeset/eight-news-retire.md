---
'sku': major
---

Target `sku`'s minimum supported node version when building the server entry

**BREAKING CHANGE**

When building the server entry, the output code was previously transpiled to be compatible with a relatively old version of Node.js. This change updates the version to mirror sku's minimum supported Node.js version (18.20.0 at time of writing). SSR users should ensure their server's Node.js runtime is up-to-date with the minimum supported version.
