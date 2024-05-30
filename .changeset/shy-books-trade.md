---
'sku': major
---

Simplify package manager detection

By default, the package manager used to run a sku command will be used by sku for installing dependencies (during `sku init`) or suggesting commands.
This can be overridden via the `--packageManager` flag:

```sh
$ npx sku init --packageManager pnpm my-app
$ cd my-app
$ pnpm start
```

If a package manager cannot be detected, _and_ the `--packageManager` flag is not used, sku will now default to using `npm`.
