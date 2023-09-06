---
'sku': minor
---

Add `--packageManager` flag

Sku detects package managers in the following order: `yarn` -> `pnpm` -> `npm`.
The `--packageManager` flag can be used to override the package manager used for the `sku init` script.
This affects what package manager is used to install dependencies, as well as the scripts present in the initialized app template.

```sh
$ pnpm dlx sku init --packageManager pnpm my-app
```
