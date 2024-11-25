---
'sku': major
---

Update `eslint-config-seek` to v14

Alongside the migration to ESLint v9, `eslint-config-seek` has been updated to v14 which supports the new flat config format.

Some lint rules have been changed or renamed, so consumers should run `sku format` to automatically update their code to conform to the new rules. You may still need to manually review and adjust your code after running `sku format` as not all issues are auto-fixable.

Additionally, `eslint-plugin-import` has been replaced with `eslint-plugin-import-x`. You should replace any references to `eslint-plugin-import` with `eslint-plugin-import-x` and any `import/` rules with `import-x/`.

See the [`eslint-config-seek` release notes] for more information.

[`eslint-config-seek` release notes]: https://github.com/seek-oss/eslint-config-seek/blob/master/CHANGELOG.md#eslint-config-seek
