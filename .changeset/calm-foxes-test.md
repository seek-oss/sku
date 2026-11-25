---
'sku': major
---

Change the default `testRunner` to `vitest`

**BREAKING CHANGE**

`testRunner` now defaults to `'vitest'` instead of `'jest'`.
Apps that don't set `testRunner` will run tests with Vitest, and use Vitest ESLint rules.
