---
'sku': major
---

Remove `storybook` CLI commands

**BREAKING CHANGE**

`sku` no longer provides the `sku storybook` and `sku build-storybook` CLI commands. Please migrate to [the official Storybook CLI][storybook cli]:

**MIGRATION GUIDE**:

```sh
pnpm install -D storybook
```

```diff
// package.json
{
  "scripts": {
-    "storybook": "sku storybook",
+    "storybook": "storybook dev",
-    "build:storybook": "sku build-storybook"
+    "build:storybook": "storybook build"
  }
}
```

[storybook cli]: https://storybook.js.org/docs/cli/
