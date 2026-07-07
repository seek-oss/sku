---
'sku': major
---

`lint`: Skip the TypeScript check when file paths are provided

Previously, `sku lint <path>` ran ESLint and Prettier on the given paths but still ran TypeScript across the *entire project*. This is because TypeScript ignores your `tsconfig.json` when filenames are passed explicitly, so the check can't be scoped to a single path.

Since linting a path should only lint that path, `sku` now skips the TypeScript check entirely when a file path is provided. To type-check as well, run `tsc` manually first:

```json
{
  "scripts": {
    "lint-path": "tsc && sku lint <path>"
  }
}
```
