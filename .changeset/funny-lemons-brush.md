---
'sku': major
---

Upgrade from jest v27 to v29

See the [v27 to v28 upgrade guide](https://jestjs.io/docs/28.x/upgrading-to-jest28) and [jest v29 announcement](https://jestjs.io/blog/2022/08/25/jest-29) for breaking changes.

Likely the most significant change is the new default snapshot format:

```diff
- Expected: \\"a\\"
+ Expected: "a"

- Object {
-   Array []
- }
+ {
+   []
+ }
```

This may require you to update your snapshots.