---
'sku': major
---

Default values for entry files use `.tsx` extensions instead of `.js`:

**BREAKING CHANGE**:

The following `sku` config options have had their default values changed.

- `clientEntry`: `'src/client.js'` → `'src/client.tsx'`
- `renderEntry`: `'src/render.js'` → `'src/render.tsx'`
- `serverEntry`: `'src/server.js'` → `'src/server.tsx'`

Existing projects with `.js` entry files will need to either rename their files to `.tsx` or explicitly specify the `.js` paths in their sku config:

```diff
// sku.config.ts
export default {
+  clientEntry: 'src/client.js',
+  renderEntry: 'src/render.js',
+  serverEntry: 'src/server.js',
  // ... rest of config
}
```
