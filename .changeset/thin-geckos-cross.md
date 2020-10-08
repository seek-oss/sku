---
'sku': minor
---

Support site specific routes

Configured sites can now contain routes which are specific that site. This is useful for cross-brand applications that have different URLs.

```js
// sku.config.js
module.exports = {
  sites: [
    {
      name: 'alpha',
      host: 'dev.alpha.com.au',
      routes: [
        { route: '/', name: 'home' },
        { route: '/details', name: 'details' },
      ],
    },
    {
      name: 'beta',
      host: 'dev.beta.com.au',
      routes: [
        { route: '/home', name: 'home' },
        { route: '/my-details', name: 'details' },
      ],
    },
  ]
}
```
