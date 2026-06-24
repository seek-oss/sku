---
'sku': minor
---

`sku` now manages the `imports` field of your `package.json` based on the `pathAliases` config option

Previously, `pathAliases` only generated TypeScript's `paths` configuration, and you had to manually add matching `#`-prefixed entries to your `package.json` `imports` field for aliases to resolve at build time.

`sku` now takes complete ownership of the `imports` field and keeps it in sync with `pathAliases` whenever it configures your project. The `imports` field is fully replaced with the entries derived from `pathAliases`, and is removed entirely when `pathAliases` is empty or omitted. Edits are applied surgically so the rest of your `package.json` is left untouched.
