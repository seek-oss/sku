---
'sku': major
---

`lint|format`: Manage recommended pnpm settings directly in `pnpm-workspace.yaml` instead of injecting them at runtime via `pnpm-plugin-sku`.

**BREAKING CHANGE**:

Sku-managed settings are marked with a `[sku_managed]` comment. `sku lint` now checks that these settings are up to date, and `sku format` writes any required changes, including removing `pnpm-plugin-sku` from `configDependencies`.

Values can be user-managed by removing the `[sku_managed]` comment from any setting or entry. However, user settings that match sku's defaults will always be re-adopted with the marker.

To opt out of workspace management entirely, set `managedWorkspace: false` in your sku config. This skips the `sku lint` check and the `sku format` sync. It defaults to `true` and does not affect the explicit `sku configure workspace` subcommand.

To migrate an existing project, run `sku format` and commit the resulting diff.
