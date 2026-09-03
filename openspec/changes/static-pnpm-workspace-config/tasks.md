## 1. Shared defaults module

- [x] 1.1 Create `private/utils/src/packageManager/pnpmWorkspaceDefaults.ts` exporting sku's recommended settings, ported from `packages/pnpm-plugin/src/config.ts`. Include values, per-key policy classification (managed single-value settings, object settings as flat maps, unioned arrays), explanatory comments (`# 3 days`, `# dependency of eslint-plugin-react`), and the `# managed by sku` marker constant
- [x] 1.2 Add unit tests for the defaults module (shape, policies, marker constant)

## 2. Sync engine

- [x] 2.1 Add `yaml` as a runtime dependency of `sku` (and `private/utils` if needed for the sync module's types)
- [x] 2.2 Create `private/utils/src/packageManager/ensurePnpmWorkspaceConfig.ts` with comment-preserving YAML sync of `pnpm-workspace.yaml`, taking a mode option (`additive` vs `enforce`) and a file-creation flag (create only)
- [x] 2.3 Implement the merge policies for both modes: additive (missing managed single-value settings, object-setting keys, and array entries added; arrays unioned and deduped; no overwrites or removals) and enforce, run only by the `sku configure` command (managed single-value overwrites in both directions, per-key object-setting alignment, retired-entry removal)
- [x] 2.4 Implement marker-based ownership: adoption of unmarked default-matching entries on every sync, re-adoption of unmarked entries that still match a default; retired-entry removal only on `sku configure`, scoped to entries still carrying a marker
- [x] 2.5 Implement drift warnings: differing managed single-value settings and object-setting values (naming the key, both values, and `sku configure`), and retired marked entries (offering both resolutions: `sku configure` removes it, or delete the marker to keep it user-managed)
- [x] 2.6 Implement `configDependencies` migration, per-change logging, and no write when aligned
- [x] 2.7 Add unit tests covering each spec scenario: additive additions, existing-value preservation, overwrites in both directions on `sku configure`, user-entry preservation, retired-entry removal on `sku configure` only (and preservation once the marker is deleted), adoption, re-adoption, re-added retired entries, comment preservation, aligned-file silence, plugin migration, missing file left untouched, drift warnings

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
