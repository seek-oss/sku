---
'sku': patch
---

`sku.config.js` previously had an effect on what was included in the `tsconfig.json#include` array. With the removal of the default `include` array, this is no longer the case and you might see a TypeScript error like this:

```
error TS18003: No inputs were found in config file '/path/to/project/tsconfig.json'. Specified 'include' paths were '["**/*"]' and 'exclude' paths were '[]'.
```

If your project contains only JavaScript files and you see the above error, you should rename `sku.config.js` to `sku.config.ts` and the error will go away.
