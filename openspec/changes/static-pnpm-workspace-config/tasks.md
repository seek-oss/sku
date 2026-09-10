## 1. Shared defaults module

- [x] 1.1 Create `private/utils/src/packageManager/pnpmWorkspaceDefaults.ts` exporting sku's recommended settings, ported from `packages/pnpm-plugin/src/config.ts`. Declare each setting once, carrying its own value, merge policy (managed single-value setting, object setting as a flat map, unioned array) and explanatory comment (`3 days`), and derive the setting groups and plain-value config from that. Include the `[sku_managed]` marker constant
- [x] 1.2 Add unit tests for the defaults module (derived values, setting groups, co-located comments, marker constant)

## 2. Sync engine

- [x] 2.1 Add `yaml` as a runtime dependency of `sku` (and `private/utils` if needed for the sync module's types)
- [x] 2.2 Create `private/utils/src/packageManager/ensurePnpmWorkspaceConfig.ts` with YAML sync of `pnpm-workspace.yaml`, taking a mode option (`additive` vs `enforce`) and a file-creation flag (create only)
- [x] 2.3 Implement the merge policies for both modes: additive (missing managed single-value settings, object-setting keys, and array entries added; arrays unioned and deduped; no config-value overwrites or user-entry removals) and enforce, run only by the `sku configure` command (managed single-value overwrites in both directions, marked object-setting alignment, retired-entry removal)
- [x] 2.4 Implement marker-based ownership: adoption of unmarked default-matching entries on every sync, comment replacement with `[sku_managed]`, re-adoption of unmarked entries that still match a default; retired-entry removal only on `sku configure`, scoped to entries still carrying a marker
- [x] 2.5 Implement drift warnings: differing managed single-value settings and marked object-setting values (naming the key, both values, and `sku configure`), and retired marked entries (offering both resolutions: `sku configure` removes it, or delete the marker to keep it user-managed)
- [x] 2.6 Implement `configDependencies` migration, per-change logging (including file creation, adoption, and duplicate removal), and no write when aligned
- [x] 2.7 Add unit tests covering each spec scenario: additive additions, existing-value preservation, overwrites in both directions on `sku configure`, unmarked object overrides, user-entry preservation, retired-entry removal on `sku configure` only (and preservation once the marker is deleted), adoption, re-adoption, re-added retired entries, marker detection, comment replacement, aligned-file silence, plugin migration, missing file left untouched, malformed files, drift warnings, and duplicate handling

## 3. Wire into sku

- [x] 3.1 Replace the plugin validation block in `packages/sku/src/utils/configureApp.ts` with a call to the sync in additive mode (guarded by `rootDir`, a pnpm project check, and an existing `pnpm-workspace.yaml`), passing enforce mode from the `sku configure` command
- [x] 3.2 Delete `packages/sku/src/services/packageManager/pnpmConfig.ts`, `getPnpmConfigDependencies.ts`, their tests and snapshots
- [x] 3.3 Remove `isAtLeastPnpmV10` and `isAtLeastRecommendedPnpmVersion` from `private/utils/src/packageManager/packageManager.ts` and update all call sites

## 4. Update create

- [x] 4.1 Replace `packages/create/src/generators/pnpmWorkspace.ts` with a call to the shared sync (`ensurePnpmWorkspaceConfig`, file creation enabled) before `installDependencies`, so create and configure share one writer
- [x] 4.2 Remove the pnpm v10 gate and `pnpm add --config pnpm-plugin-sku` from `packages/create/src/services/install.ts`
- [x] 4.3 Drop the `pnpm-plugin-sku` dependency from `packages/create/package.json`

## 5. Tests and release

- [x] 5.1 Update `tests/node/sku-create.test.ts` snapshots: `pnpm-workspace.yaml` gains markers, loses `configDependencies`
- [x] 5.2 Add an integration test (e.g. `tests/node/pnpm-workspace-config.test.ts`) covering first-run migration of a plugin-era project (additive only, existing values untouched) and steady-state silence
- [x] 5.3 Add a changeset (minor) describing the additive sync, the drift warnings, the enforcing `sku configure` mode, the `configDependencies` migration, the object-setting conflict flip, the `skuSkipConfigure` escape hatch, and how to keep a retired entry (delete its marker, or add it back)
- [x] 5.4 Update docs (`site/docs/cli.md` or relevant page) with the two sync modes, the managed-settings behaviour, and opt-outs

## 6. Major rework: lint/format enforcement

Sections 1–5 shipped the two-tier minor design; this section reworks it into the major design before release: enforcement as the only behaviour, `sku lint`/`sku format` as the only entry points, and uniform marker ownership.

- [ ] 6.1 Remove the `SyncMode` type and mode plumbing from the sync engine: enforcement becomes the only behaviour (delete the additive branches and the warn channel from `syncSingleValueSettings`, `syncObjectSettings`, `syncArraySettings`, and `syncShared`)
- [ ] 6.2 Split the sync into computing required changes and applying them, so `sku lint` can report without writing; the computed result carries two channels: required managed changes (lint failures) and user-managed drift advisories (unmarked values differing from defaults, info-level)
- [ ] 6.3 Make markers load-bearing for single-value settings: an unmarked single-value setting that differs from the default is user-managed (preserved by format, info-logged by lint); adoption still marks unmarked values matching defaults
- [ ] 6.4 Remove the sync from `configureApp` (including `ConfigureAppOptions.mode` and the `mode` argument in the `sku configure` action), so no command other than lint/format syncs and postinstall goes quiet
- [ ] 6.5 Add a "pnpm workspace" check to `sku lint` via `runLintChecks`: fails on missing managed keys, differing marked values, retired marked entries, unmarked values pending adoption, and `pnpm-plugin-sku` in `configDependencies`, directing users to `sku format`; logs user-managed drift as info; passes silently when aligned, for non-pnpm projects, and when the file is absent
- [ ] 6.6 Add the enforcing sync to `sku format`
- [ ] 6.7 Rework the sync unit tests: delete additive-mode and drift-warning cases; add check-mode cases (fail vs info vs silent), uniform-ownership cases for single-value settings (unmarked differing value preserved by format and info-logged by lint), and format enforcement cases
- [ ] 6.8 Rework `tests/node/pnpm-workspace-config.test.ts` around lint/format: lint fails on managed drift and passes after `sku format`; differing unmarked values are preserved and info-logged; `sku configure` and other commands no longer touch the file
- [ ] 6.9 Rewrite the changeset as a major: breaking entry-point change (lint/format only, no longer configure/postinstall), unconditional enforcement of managed values, uniform marker ownership, marker deletion as the only opt-out, `skuSkipConfigure`/`skuSkipPostInstall` no longer gating the sync, and the one-time `sku format` migration diff
- [ ] 6.10 Update docs (`site/docs/cli.md` or relevant page): lint check and format write behaviour, failure/info semantics, opt-out via marker deletion, and migration guidance
