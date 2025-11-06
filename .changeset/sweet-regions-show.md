---
'@sku-lib/codemod': minor
---

jest-to-vitest: Add support for transforming `jest.fn` calls with TypeScript generics.

```diff
- const middleware = jest.fn<void, Parameters<Middleware>>();
+ const middleware = vi.fn<(...args: Parameters<Middleware>) => void>();

- const callback = jest.fn<string, [number, boolean]>();
+ const callback = vi.fn<(...args: [number, boolean]) => string>();
```
