---
'sku': minor
'@sku-lib/create': minor
---

Migrate from `pnpm-plugin-sku` to static, comment-preserving `pnpm-workspace.yaml` configuration.

### Summary of Changes

- **Static Workspace Configuration**: Sku's recommended pnpm settings are now written directly into `pnpm-workspace.yaml` with `# managed by sku` markers instead of being injected at runtime via `pnpm-plugin-sku`.
- **Automatic Migration**: On the first run of any sku command or postinstall, `pnpm-plugin-sku` is removed from `configDependencies` in `pnpm-workspace.yaml` (and the `configDependencies` field is deleted if empty).
- **Two Sync Modes**:
  - **Additive Sync (every sku command & postinstall)**: Adds missing managed single-value settings and `allowBuilds` keys, unions and deduplicates array settings (`publicHoistPattern`, `minimumReleaseAgeExclude`, `trustPolicyExclude`), and never overwrites existing user values or removes entries.
  - **Enforce Mode (`sku configure`)**: Overwrites managed single-value settings and sku-owned `allowBuilds` keys to match sku defaults in both directions. Removes retired sku defaults that still carry a `# managed by sku` marker.
- **Drift Warnings**: Regular sku commands warn when managed values differ from sku defaults or when retired entries still have a `# managed by sku` marker, suggesting `sku configure` to align.
- **Opt-outs and Escape Hatches**:
  - `skuSkipConfigure: true` in `package.json` disables the sync on regular sku commands (`skuSkipPostInstall: true` disables it on postinstall). Manual `sku configure` always syncs.
  - To keep an entry that sku has retired, delete its `# managed by sku` marker comment (or re-add it without a marker) to designate it as user-managed.
- **New Project Scaffolding**: `@sku-lib/create` now uses the shared sync engine to emit `pnpm-workspace.yaml` on project creation, without installing `pnpm-plugin-sku` or gating on pnpm versions.
