---
'sku': patch
---

Series of small fixes
- Update the SkuConfig type to accept `ReadonlyArray`s, to allow for passing in of `as const` arrays.
- Allowed TypeScript versions newer than 4.5. There were issues in 4.5 that broke vanilla-extract and braid, that have been fixed in 4.6.
- Updated the `lib` of tsconfig to `es2019`, to allow access to all that flatMappy goodness.
