---
'sku': minor
---

Upgrade from jest v27 to v29

Please take a look at the following upgrade guides as there may be breaking changes that affect your tests:
- [v27 to v28 upgrade guide](https://jestjs.io/docs/28.x/upgrading-to-jest28) 
- [v28 to v29 upgrade guide](https://jestjs.io/docs/upgrading-to-jest29)

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