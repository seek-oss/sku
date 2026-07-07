---
'sku': major
---

`lint`: Skip the TypeScript check when file paths are provided

Running `sku lint` with a file path runs ESLint and Prettier on the given paths.
However, TypeScript checks would still run across the *entire project*.
This happened because TypeScript, by design, ignores your `tsconfig.json` whenever filenames are passed explicitly, leaving no way to scope the check to a single path.

Since targeting a specific file path should only lint that path, this behaviour may lead to confusion.
To better match expectations, `sku` now skips the TypeScript check entirely when a file path is provided.

To recreate the previous behaviour, you can run `tsc` manually before your specific lint command.
Keep in mind this may not be your desired behaviour if you're linting a single file.

```json
{
  "scripts": {
    "lint-file": "tsc && sku lint ./some/file.ts"
  }
}
```
