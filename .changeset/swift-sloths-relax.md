---
'sku': minor
---

Drop support for Node v12

Sku now only supports Node v14.15 and above.
Although sku itself does not depend on any Node v14 APIs, Node v12 is [no longer officially supported](https://github.com/nodejs/Release#end-of-life-releases), and many of sku's dependencies no longer support it either.
Please ensure you are using a supported version of Node both locally (e.g. via a `.nvmrc` file) and in CI (check your docker images).