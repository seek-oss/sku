---
'sku': minor
---

lint|format: Enforce sorted keys in package.json

ESLint will now warn if the keys in package.json are not sorted. Running `sku format` will automatically fix the sort order.

If you need to, you can disable this rule by using `dangerouslySetESLintConfig` in your sku config (not recommended):

```ts
const config = {
  ...,
  dangerouslySetESLintConfig: (esLintConfig) => [
    ...esLintConfig,
    {
      files: ['**/package.json'],
      rules: {
        'package-json/sort': 'off',
      },
    },
  ],
}
```
