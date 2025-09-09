---
'@sku-lib/codemod': minor
---

Add `jest-to-vitest` codemod

The `jest-to-vitest` codemod automates the migration of test files from Jest to Vitest. The following code patterns are transformed:
- Renaming `jest` to `vi`
- Importing globals such as `expect, it, describe, beforeAll`
- Updating `jest.requireActual` to `await vi.importActual`
- Wrapping functions that call `await vi.importActual` with `async`

**EXAMPLE USAGE**:

```sh
pnpm dlx @sku-lib/codemod jest-to-vitest .
```
