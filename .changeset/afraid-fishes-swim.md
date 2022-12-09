---
'sku': minor
---

Add `package.json` configuration flags that enable you to skip sku configuration and peer dep validation

**NOTE**: These settings disable critical functionality of sku, so you likely
don't want to use them unless you know what you're doing

- `skuSkipConfigure`: Skip generation and configuration of config files. E.g. .prettierrc, tsconfig.json, etc.
- `skuSkipPeerDepValidation`: Skip checking for multiple copies of the same package. You likely want to try and fix the warnings found by this check rather than disabling it.

**EXAMPLE USAGE**:

```jsonc
// package.json
{
  //
  "skuSkipConfigure": true,
  // Skip checking for multiple copies of the same package. You likely want to try and fix the
  // warnings found by this check rather than disabling it.
  "skuSkipPeerDepValidation": true
}
```
