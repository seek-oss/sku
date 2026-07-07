---
'sku': major
---

`lint`: Skip the TypeScript check when file paths are provided

Previously, running `sku lint` with a file path would still run the TypeScript check across the entire project. This happened because TypeScript, by design, ignores your `tsconfig.json` whenever filenames are passed explicitly, leaving no way to scope the check to a single path.

Since targeting a specific file path should only lint that path, this behaviour may lead to unexpected results. To better match expectations, `sku` now skips the TypeScript check entirely when a file path is provided.
