---
'sku': major
---

Upgrade `eslint` to `^8.56.0` and `eslint-config-seek` to `^13.0.0`

These changes enable TypeScript Eslint support for TypeScript 5.4, but necessitate dropping support for Node.js versions below 18.18.0. This change may also require consumers to fix linting errors in their codebase. The majority of changes can be fixed by running `sku format`.
