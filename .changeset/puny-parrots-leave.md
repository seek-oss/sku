---
'@sku-lib/codemod': minor
---

jest-to-vitest: Update codemod to transform `jest.beforeAll/beforeEach/afterAll/afterEach` calls with function references into arrow functions

```diff
-  beforeAll(someSetupFunction)
+  beforeAll(() => { someSetupFunction() })
```
