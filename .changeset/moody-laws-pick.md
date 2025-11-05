---
'@sku-lib/codemod': minor
---

jest-to-vitest: Transform generics in .resolves/.rejects expect chains with satisfies operator

```diff
- expect(result).resolves.toEqual<MyType>({});
+ expect(result).resolves.toEqual({} satisfies MyType);

- expect(promise).rejects.toThrow<ErrorType>(error);
+ expect(promise).rejects.toThrow(error satisfies ErrorType);
```
