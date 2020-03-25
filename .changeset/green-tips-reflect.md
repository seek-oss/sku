---
'sku': major
---

Remove deprecated react-treat re-exports from `sku/treat`

**BREAKING CHANGES**

`react-treat` APIs (`useStyles`, `TreatProvider` & `useClassName`) can no longer be imported from `sku/treat`

**MIGRATION GUIDE**

Update all imports of `useStyles`, `TreatProvider` & `useClassName` to `sku/react-treat`.

e.g.
```diff
-import { useStyles } from 'sku/treat';
+import { useStyles } from 'sku/react-treat';
```