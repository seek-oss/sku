---
'sku': patch
---

Ensure all sku-generated gitignored files are present in `.prettierignore` and `.eslintignore` too

Consumers should notice a few new files being added to the sku-managed sections within `.prettierignore` and `.eslintignore` the next time a `sku` command is run:

```diff
# managed by sku
*.less.d.ts
+.eslintcache
+.eslintrc
+.prettierrc
.storybook/main.js
coverage/
dist-storybook/
dist/
report/
# end managed by sku
```

These changes should be committed to your repo.
