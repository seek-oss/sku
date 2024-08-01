---
'sku': patch
---

Fix incorrect path in ignore files when running `sku init`

sku generates ignore files (e.g. `.eslintignore`) for the project.
The current working directory (CWD) used would sometimes be incorrect when first ran as part of `sku init`.
It should now give the same result as `sku configure`.

This change includes a refactor on how the Webpack Target Directory is set in ignore files.