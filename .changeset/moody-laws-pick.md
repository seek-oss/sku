---
'@sku-lib/codemod': minor
---

jest-to-vitest: Transform generics in expect chains with satisfies operator

```diff
- expect(result).resolves.toEqual<MyType>({});
+ expect(result).resolves.toEqual({} satisfies MyType);

- expect(stringValue).toBe<string>('hello');
+ expect(stringValue).toBe('hello' satisfies string);
```
