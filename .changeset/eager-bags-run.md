---
'sku': minor
---

Support Storybook v10

Storybook v10 requires its configuration files to be written in ESM. In applications that are already using ESM (have set `"type": "module"` in their `package.json`), there should be very little, if anything, to change.

If you are not using ESM yet, then you _may_ need to make changes to your storybook configuration files, though it's worth running `storybook` first to confirm whether any changes are necessary.

Typical changes include:

- Renaming file extensions from `.js` to `.mjs` (or typescript equivalents)
- Converting `require` statements to `import` statements
- Converting `module.exports` to `export` statements
- Adding file extensions to import statements (e.g. `import foo from './foo.js'` instead of `import foo from './foo'`)

For more information, see the [Storybook v10 migration guide].

[Storybook v10 migration guide]: https://storybook.js.org/docs/releases/migration-guide
