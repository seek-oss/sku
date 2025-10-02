---
'sku': major
---

Drop `sku init` in favour of `@sku-lib/create`

BREAKING CHANGE:

The `sku init` command will now no longer do anything and will display a deprecation notice when used.
It will be removed entirely in a future major version.

To create a new `sku` project, use `@sku-lib/create` instead. Example usage:

```
pnpm dlx @sku-lib/create my-app
```
