## 1. Shared defaults module

- [ ] 1.1 Create `private/utils/src/packageManager/pnpmWorkspaceDefaults.ts` exporting sku's recommended settings, ported from `packages/pnpm-plugin/src/config.ts`. Include values, per-key policy classification (managed scalars, `allowBuilds` map, unioned arrays), explanatory comments (`# 3 days`, `# dependency of eslint-plugin-react`), and the `# managed by sku` marker constant
- [ ] 1.2 Add unit tests for the defaults module (shape, policies, marker constant)

## 2. Sync engine

- [ ] 2.1 Add `yaml` as a runtime dependency of `sku` (and `private/utils` if needed for the sync module's types)
- [ ] 2.2 Create `private/utils/src/packageManager/ensurePnpmWorkspaceConfig.ts` with comment-preserving YAML sync of `pnpm-workspace.yaml`
- [ ] 2.3 Implement the merge policies: managed scalar overwrite, `allowBuilds` per-key reconcile, array union and dedupe
- [ ] 2.4 Implement marker-based ownership: adoption of unmarked default-matching entries, retired-entry removal, re-adoption of unmarked entries that still match a default
- [ ] 2.5 Implement `configDependencies` migration, per-change logging, and no write when aligned
- [ ] 2.6 Add unit tests covering each spec scenario: overwrite both directions, user-entry preservation, retired-entry removal, adoption, re-adoption, re-added retired entries, comment preservation, aligned-file silence, plugin migration, missing-file creation

## 3. Wire into sku

- [ ] 3.1 Replace the plugin validation block in `packages/sku/src/utils/configureApp.ts` with a call to the sync (guarded by `rootDir` and a pnpm project check)
- [ ] 3.2 Delete `packages/sku/src/services/packageManager/pnpmConfig.ts`, `getPnpmConfigDependencies.ts`, their tests and snapshots
- [ ] 3.3 Remove `isAtLeastPnpmV10` and `isAtLeastRecommendedPnpmVersion` from `private/utils/src/packageManager/packageManager.ts` and update all call sites

## 4. Update create

- [ ] 4.1 Replace `packages/create/src/generators/pnpmWorkspace.ts` with a call to the shared sync (`ensurePnpmWorkspaceConfig`) before `installDependencies`, so create and configure share one writer
- [ ] 4.2 Remove the pnpm v10 gate and `pnpm add --config pnpm-plugin-sku` from `packages/create/src/services/install.ts`
- [ ] 4.3 Drop the `pnpm-plugin-sku` dependency from `packages/create/package.json`

## 5. Tests and release

- [ ] 5.1 Update `tests/node/sku-create.test.ts` snapshots: `pnpm-workspace.yaml` gains markers, loses `configDependencies`
- [ ] 5.2 Add an integration test (e.g. `tests/node/pnpm-workspace-config.test.ts`) covering first-run migration of a plugin-era project and steady-state silence
- [ ] 5.3 Add a changeset describing the migration, the `skuSkipConfigure` escape hatch, and how to restore a retired entry (add it back)
- [ ] 5.4 Update docs (`site/docs/cli.md` or relevant page) with the managed-settings behaviour and opt-outs
