---
'sku': minor
---

Remove the `postinstall` hook

Sku no longer runs a script at install time. Generated project files (`tsconfig.json`, `eslint.config.mjs`, `.prettierrc`, etc.) are no longer created during `install` and instead are written by the first run of any sku command or by running `sku configure` explicitly.

The `skuSkipPostInstall`/`skuSkipPostinstall` package.json fields are no longer read and can be removed from projects. `skuSkipConfigure` is unaffected.
