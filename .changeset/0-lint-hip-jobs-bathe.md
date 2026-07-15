---
'sku': major
---

`lint`: Skip the TypeScript check when file paths are provided

Previously, `sku lint <path>` ran ESLint and Prettier on the given paths but still ran TypeScript across the *entire project*. This is because TypeScript ignores your `tsconfig.json` when filenames are passed explicitly, so the check can't be scoped to a single path.

This unexpected behaviour has now been removed: `sku` now skips the TypeScript check entirely when a file path is provided. To replicate the previous behaviour, run `tsc` manually first:

```diff
{
  "scripts": {
-    "lint-path": "sku lint <path>"
+    "lint-path": "tsc && sku lint <path>"
  }
}
```
