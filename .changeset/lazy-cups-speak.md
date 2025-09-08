---
'sku': minor
---

**DEPRECATION**: `sku init` is now deprecated in favor of `@sku-lib/create`

The `sku init` command now shows a deprecation warning directing users to use the new standalone `@sku-lib/create` package instead. This new package provides better UX with interactive prompts and maintains full parity with `sku init` functionality.

**Migration:**
- Old: `pnpm dlx sku init my-app` 
- New: `pnpm dlx @sku-lib/create my-app`

The `sku init` command will continue to work but will be removed in an upcoming release.