---
'sku': minor
---

Export internal Jest configuration as a [preset](https://jestjs.io/docs/configuration#preset-string) under `sku/config/jest`. This allows consumers to debug tests in their IDE by specifying the preset in their `jest.config.js`:

```js
/** @type {import('jest').Config} */
module.exports = {
  preset: 'sku/config/jest',
};
```
