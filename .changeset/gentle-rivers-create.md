---
'@sku-lib/create': major
---

Remove the `webpack` template

**BREAKING CHANGE**

`--template webpack` is no longer supported, and the interactive prompt no longer offers it.
The available templates are `vite` and `ssr`, which both use Vite and Vitest.
An unknown `--template` value now fails with an error that lists the available templates.
