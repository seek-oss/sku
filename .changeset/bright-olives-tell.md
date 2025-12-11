---
'sku': minor
---

Use `vitest`-specific ESLint rules when `testRunner: 'vitest'` is configured

Consumers using `vitest` may see new ESLint rules applied to their codebase.
Previously `jest` rules were always applied regardless of the configured test runner.
