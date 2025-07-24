---
'sku': minor
---

`sku configure`: suggest recommended configuration changes for PNPM applications

During configuration, `sku` will conditionally output warning logs that suggest users make the following changes:
- Migrate `.npmrc` configuration to `pnpm-workspace.yaml`
- Update PNPM to at least v10.13.0
- Delete top-level `node_modules` and install the `pnpm-plugin-sku` [config dependency] via `pnpm add --config pnpm-plugin-sku && pnpm install`

Applying all of these changes will suppress these warnings.

The combination of these three changes will ensure PNPM hoists dependencies necessary for a smooth development experience across all IDEs, and runs necessary post-install scripts for some of `sku`'s dependencies. The [config dependency] in particular enables `sku` to effectively manage any future configuration changes that are necessary to ensure PNPM applications function correctly.

[config dependency]: https://pnpm.io/config-dependencies
