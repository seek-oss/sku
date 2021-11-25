---
'sku': minor
---

Config files can now be in TypeScript

Previously, projects were configured using a `sku.config.js` file, which exported a config object.
As most projects at SEEK are now TypeScript based, having a JS config file makes it impossible to reuse any of your production code in the config (e.g. routes).

This change makes it possible to use a TypeScript config file, by default `sku.config.ts`.
The easiest way to migrate is to change the module exports to a default export:
```diff
- // sku.config.js
+ // sku.config.ts
- module.exports = {
+ export default {
  clientEntry: 'src/client.tsx',
  // ...
}
```

But sku also now exports a type for the config object, to make it easier to setup and understand the configuration options.
```diff
+ import type { SkuConfig } from 'sku';
+
- module.exports = {
+ const config: SkuConfig = {
  clientEntry: 'src/client.tsx',
  // ...
}
+
+ export default config;
```

`sku init` will now create TypeScript config files by default.