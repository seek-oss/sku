## 1. Shared defaults module

- [ ] 1.1 Create `private/utils/src/packageManager/pnpmWorkspaceDefaults.ts` exporting sku's recommended settings, ported from `packages/pnpm-plugin/src/config.ts`. Include values, per-key policy classification (managed scalars, `allowBuilds` map, unioned arrays), explanatory comments (`# 3 days`, `# dependency of eslint-plugin-react`), and the `# managed by sku` marker constant
- [ ] 1.2 Add unit tests for the defaults module (shape, policies, marker constant)

## 2. Sync engine

- [ ] 2.1 Add `yaml` as a runtime dependency of `sku` (and `private/utils` if needed for the sync module's types)
- [ ] 2.2 Create `private/utils/src/packageManager/ensurePnpmWorkspaceConfig.ts` with comment-preserving YAML sync of `pnpm-workspace.yaml`, taking a mode option (`additive` vs `enforce`) and a file-creation flag (create only)
- [ ] 2.3 Implement the merge policies for both modes: additive (missing managed scalars, `allowBuilds` keys, and array entries added; arrays unioned and deduped; no overwrites or removals) and enforce (managed scalar overwrite in both directions, `allowBuilds` per-key reconcile, retired-entry removal)
- [ ] 2.4 Implement marker-based ownership: adoption of unmarked default-matching entries on every sync, re-adoption of unmarked entries that still match a default; retired-entry removal in enforce mode only, scoped to entries still carrying a marker
- [ ] 2.5 Implement drift warnings: differing managed scalars and `allowBuilds` values (naming the key, both values, and `sku configure`), and retired marked entries (offering both resolutions: `sku configure` removes it, or delete the marker to keep it user-managed)
- [ ] 2.6 Implement `configDependencies` migration, per-change logging, and no write when aligned
- [ ] 2.7 Add unit tests covering each spec scenario: additive additions, existing-value preservation, enforce-mode overwrites both directions, user-entry preservation, retired-entry removal on enforce only (and preservation once the marker is deleted), adoption, re-adoption, re-added retired entries, comment preservation, aligned-file silence, plugin migration, missing file left untouched, drift warnings

## 3. Wire into sku

- [ ] 3.1 Replace the plugin validation block in `packages/sku/src/utils/configureApp.ts` with a call to the sync in additive mode (guarded by `rootDir`, a pnpm project check, and an existing `pnpm-workspace.yaml`), passing enforce mode from the `sku configure` command
- [ ] 3.2 Delete `packages/sku/src/services/packageManager/pnpmConfig.ts`, `getPnpmConfigDependencies.ts`, their tests and snapshots
- [ ] 3.3 Remove `isAtLeastPnpmV10` and `isAtLeastRecommendedPnpmVersion` from `private/utils/src/packageManager/packageManager.ts` and update all call sites

## 4. Update create

- [ ] 4.1 Replace `packages/create/src/generators/pnpmWorkspace.ts` with a call to the shared sync (`ensurePnpmWorkspaceConfig`, file creation enabled) before `installDependencies`, so create and configure share one writer
- [ ] 4.2 Remove the pnpm v10 gate and `pnpm add --config pnpm-plugin-sku` from `packages/create/src/services/install.ts`
- [ ] 4.3 Drop the `pnpm-plugin-sku` dependency from `packages/create/package.json`

## 5. Tests and release

- [ ] 5.1 Update `tests/node/sku-create.test.ts` snapshots: `pnpm-workspace.yaml` gains markers, loses `configDependencies`
- [ ] 5.2 Add an integration test (e.g. `tests/node/pnpm-workspace-config.test.ts`) covering first-run migration of a plugin-era project (additive only, existing values untouched) and steady-state silence
- [ ] 5.3 Add a changeset (minor) describing the additive sync, the drift warnings, the enforcing `sku configure` mode, the `configDependencies` migration, the `allowBuilds` conflict flip, the `skuSkipConfigure` escape hatch, and how to keep a retired entry (delete its marker, or add it back)
- [ ] 5.4 Update docs (`site/docs/cli.md` or relevant page) with the two sync modes, the managed-settings behaviour, and opt-outs
