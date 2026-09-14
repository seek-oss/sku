---
'sku': major
'@sku-lib/create': major
---

**BREAKING**: Migrate from `pnpm-plugin-sku` runtime configuration to static `pnpm-workspace.yaml` synchronization via `sku lint` and `sku format`.

### Breaking Changes

- **Lint and Format Entry Points Only**: Sku no longer syncs or checks `pnpm-workspace.yaml` during `sku configure`, `postinstall`, or configuration-enabled commands (`sku start`, `sku build`, `sku test`). Syncing runs exclusively as a read-only check in `sku lint` and an enforcing write in `sku format`.
- **`skuSkipConfigure` and `skuSkipPostInstall` No Longer Gate Sync**: Because configuration no longer runs from those paths, `skuSkipConfigure` and `skuSkipPostInstall` in `package.json` do not apply to workspace configuration.
- **Unconditional Enforcement for Managed Values**: `sku format` forcefully aligns all sku-managed values with sku's recommended defaults: missing managed settings are added, marked values differing from defaults are rewritten in both directions, and retired marked entries are removed.
- **Lint Gating**: `sku lint` fails if `pnpm-workspace.yaml` requires managed changes (missing settings, outdated marked values, retired marked entries, unmarked values matching defaults pending adoption, or `pnpm-plugin-sku` present in `configDependencies`), directing you to run `sku format`.
- **`allowBuilds` Conflict Flip**: In earlier versions, `pnpm-plugin-sku` merged `allowBuilds` at runtime such that plugin defaults overrode user overrides. With static configuration, user-managed entries in `pnpm-workspace.yaml` win.

### Summary of Changes

- **Static Workspace Configuration**: Sku's recommended pnpm settings are now written directly into `pnpm-workspace.yaml` with `[sku_managed]` comment markers instead of being injected at runtime via `pnpm-plugin-sku`.
- **Uniform Marker Ownership**: Every value is either sku-managed (carries a `[sku_managed]` comment marker) or user-managed (unmarked). This applies uniformly across single-value settings (`minimumReleaseAge`, `trustPolicy`, etc.), object setting keys (`allowBuilds`), and array entries (`publicHoistPattern`, `minimumReleaseAgeExclude`, `trustPolicyExclude`).
- **Adoption**: Unmarked values that match sku's current defaults are adopted (marked with `[sku_managed]`) on `sku format`.
- **User-Managed Drift Advisories**: Unmarked values that differ from sku defaults are preserved by `sku format` and surfaced as info-level advisories in `sku lint` detailing the two re-alignment paths: edit the value to match sku's default, or delete it and run `sku format` to re-add it as sku-managed.
- **Opt-outs**: Deleting the `[sku_managed]` comment marker from any setting or entry makes it user-managed so `sku format` will never rewrite or remove it.
- **One-Time Upgrade Migration**: On upgrading, run `sku format` to generate the one-time, git-reviewable diff removing `pnpm-plugin-sku` from `configDependencies`, adding missing defaults, and adopting matching values.
- **New Project Scaffolding**: `@sku-lib/create` creates new projects with static `pnpm-workspace.yaml` files and no longer installs `pnpm-plugin-sku`.
