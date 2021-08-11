---
'sku': major
---

Add persistentCache option and enable by default

The new `persistentCache` option will turn on webpack's filesystem  caching between runs of `sku start` and `sku start-ssr`. This should result in much faster dev server start times when the cache is vaild. 

BREAKING CHANGE

Unfortunately treat files are not compatible with the `persistentCache` option, so it will need to be disabled in your project until you have migrated them to Braid components or `.css.ts` files. 

```js
// sku.config.js
module.exports = {
    persistentCache: false
}
```

> This limitation only applies to files inside the current project, any treat files within node_modules can be safely ignored. 