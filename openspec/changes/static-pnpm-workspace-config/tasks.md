## 1. Shared defaults module

- [x] 1.1 Create `private/utils/src/packageManager/pnpmWorkspaceDefaults.ts` exporting sku's recommended settings, ported from `packages/pnpm-plugin/src/config.ts`. Declare each setting once. Carry its own value, merge policy (managed single-value setting, object setting as a flat map, unioned array) and explanatory comment (`3 days`). Derive the setting groups and plain-value config from that. Include the `[sku_managed]` marker constant
- [x] 1.2 Add unit tests for the defaults module (derived values, setting groups, co-located comments, marker constant)

## 2. Sync engine

- [x] 2.1 Add `yaml` as a runtime dependency of `sku` (and `private/utils` if needed for the sync module's types)
- [x] 2.2 Create `private/utils/src/packageManager/syncPnpmWorkspaceConfig.ts` with YAML sync of `pnpm-workspace.yaml`. It takes a mode option (`additive` vs `enforce`) and a file-creation flag (create only)
- [x] 2.3 Implement the merge policies for both modes. Additive mode adds missing managed single-value settings, object-setting keys, and array entries. Arrays are unioned and deduped. Additive mode does not overwrite config values or remove user entries. Enforce mode runs only on the `sku configure` command. It overwrites managed single-value settings in both directions, aligns marked object-settings, and removes retired entries
- [x] 2.4 Implement marker-based ownership. Adopt unmarked default-matching entries on every sync. Replace comments with `[sku_managed]`. Re-adopt unmarked entries that still match a default. Remove retired entries only on `sku configure`, scoped to entries still carrying a marker
- [x] 2.5 Implement drift warnings. Warn on differing managed single-value settings and marked object-setting values (naming the key, both values, and `sku configure`). Warn on retired marked entries (offering both resolutions: `sku configure` removes it, or remove the marker to keep it user-managed)
- [x] 2.6 Implement `configDependencies` migration, per-change logging (including file creation, adoption, and duplicate removal), and no write when aligned
- [x] 2.7 Add unit tests covering each spec scenario. Cover:
  - additive additions
  - existing-value preservation
  - overwrites in both directions on `sku configure`
  - unmarked object overrides
  - user-entry preservation
  - retired-entry removal on `sku configure` only (and preservation once the marker is removed)
  - adoption, re-adoption, re-added retired entries
  - marker detection, comment replacement, aligned-file silence
  - plugin migration, missing file left untouched, malformed files
  - drift warnings and duplicate handling

## 3. Wire into sku

- [x] 3.1 Replace the plugin validation block in `packages/sku/src/utils/configureApp.ts` with a call to the sync in additive mode. Guard the call with `rootDir`, a pnpm project check, and an existing `pnpm-workspace.yaml`. Pass enforce mode from the `sku configure` command
- [x] 3.2 Remove `packages/sku/src/services/packageManager/pnpmConfig.ts`, `getPnpmConfigDependencies.ts`, their tests and snapshots
- [x] 3.3 Remove `isAtLeastPnpmV10` and `isAtLeastRecommendedPnpmVersion` from `private/utils/src/packageManager/packageManager.ts` and update all call sites

## 4. Update create

- [x] 4.1 Replace `packages/create/src/generators/pnpmWorkspace.ts` with a call to the shared sync (`syncPnpmWorkspaceConfig`, file creation enabled) before `installDependencies`, so create and configure share one writer
- [x] 4.2 Remove the pnpm v10 gate and `pnpm add --config pnpm-plugin-sku` from `packages/create/src/services/install.ts`
- [x] 4.3 Drop the `pnpm-plugin-sku` dependency from `packages/create/package.json`

## 5. Tests and release

- [x] 5.1 Update `tests/node/sku-create.test.ts` snapshots: `pnpm-workspace.yaml` gains markers, loses `configDependencies`
- [x] 5.2 Add an integration test (e.g. `tests/node/pnpm-workspace-config.test.ts`) covering first-run migration of a plugin-era project (additive only, existing values untouched) and steady-state silence
- [x] 5.3 Add a changeset (minor). Describe the additive sync, the drift warnings, and the enforcing `sku configure` mode. Describe the `configDependencies` migration, the object-setting conflict flip, and the `skuSkipConfigure` escape hatch. Describe how to keep a retired entry (remove its marker, or add it back)
- [x] 5.4 Update docs (`site/docs/cli.md` or relevant page) with the two sync modes, the managed-settings behaviour, and opt-outs

## 6. Major rework: lint/format enforcement

Sections 1-5 implemented the two-tier minor design. This section reworks it into the major design before release. Enforcement is the only behaviour. `sku lint` and `sku format` are the only entry points. Marker ownership is uniform.

- [x] 6.1 Remove the `SyncMode` type and mode plumbing from the sync engine. Enforcement becomes the only behaviour. Remove the additive branches and the warn channel from `syncSingleValueSettings`, `syncObjectSettings`, `syncArraySettings`, and `syncShared`
- [x] 6.2 Split the sync into computing required changes and applying them, so `sku lint` can report without writing. The computed result carries two channels: required managed changes (lint failures) and user-managed drift advisories (unmarked values differing from defaults, info-level)
- [x] 6.3 Make markers load-bearing for single-value settings. An unmarked single-value setting that differs from the default is user-managed (preserved by format, info-logged by lint). Adoption still marks unmarked values matching defaults
- [x] 6.4 Remove the sync from `configureApp` (including `ConfigureAppOptions.mode` and the `mode` argument in the `sku configure` action). No command other than lint/format syncs. Postinstall goes quiet
- [x] 6.5 Add a "pnpm workspace" check to `sku lint` via `runLintChecks`. Fail on missing managed keys, differing marked values, retired marked entries, unmarked values pending adoption, and `pnpm-plugin-sku` in `configDependencies`. Direct users to `sku format`. Log user-managed drift as info. Pass silently when aligned, for non-pnpm projects, and when the file is absent
- [x] 6.6 Add the enforcing sync to `sku format`
- [x] 6.7 Rework the sync unit tests. Remove additive-mode and drift-warning cases. Add check-mode cases (fail vs info vs silent). Add uniform-ownership cases for single-value settings (unmarked differing value preserved by format and info-logged by lint). Add format enforcement cases
- [x] 6.8 Rework `tests/node/pnpm-workspace-config.test.ts` around lint/format. Lint fails on managed drift and passes after `sku format`. Differing unmarked values are preserved and info-logged. `sku configure` and other commands no longer touch the file
- [x] 6.9 Rewrite the changeset as a major. Cover the breaking change: `sku lint` gains a workspace-config check that fails on drift, and `sku format` enforces the settings and migrates away from `pnpm-plugin-sku`. Cover unconditional enforcement of managed values and uniform marker ownership. Cover marker removal as the only opt-out, `skuSkipConfigure`/`skuSkipPostInstall` not gating the sync, and the one-time `sku format` migration diff
- [x] 6.10 Update docs (`site/docs/cli.md` or relevant page). Cover lint check and format write behaviour, failure/info semantics, opt-out via marker removal, and migration guidance

## 7. Workspace subcommand

- [x] 7.1 Add a `workspace` subcommand under `sku configure` (`packages/sku/src/program/commands/configure/commands/workspace/`, following the `translations` subcommand structure). Its action runs the enforcing sync with `targetDir: rootDir` from `@sku-private/utils`. It does not run `configureApp` and does not read a sku config file, so it works under `pnpm dlx`
- [x] 7.2 Gate the subcommand on `isPnpm` and a resolved `rootDir`. Pass `create` so the subcommand creates the file when the workspace root has none — explicitly configuring a workspace is an opt-in
- [x] 7.3 Add a `--check` flag that runs `checkPnpmWorkspaceConfig` against the workspace root instead of writing. Failures name the key and the current and recommended states, and direct the user to `sku configure workspace` (not `sku format`). User-managed drift logs as info. Aligned files pass silently. Missing files fail the check, directing the user to `sku configure workspace`, since the write mode would create the file
- [x] 7.4 Add integration tests (e.g. in `tests/node/pnpm-workspace-config.test.ts`) covering:
  - running from a nested package directory syncs the root file and leaves package files untouched
  - running from the workspace root
  - running without a sku config file
  - a missing root file is created on write, and fails `--check` with a direction to `sku configure workspace`
    - non-pnpm projects no-op
  - `--check` fails on managed drift, passes silently when aligned, and never writes
- [x] 7.5 Update the changeset (`.changeset/static-pnpm-workspace-config.md`) with the `sku configure workspace` subcommand: workspace-root targeting, `--check` mode, `pnpm dlx` usage, and that package-level lint/format still never touch ancestor files
- [x] 7.6 Update `site/docs/cli.md`: document `sku configure workspace` and `--check` under the configure section, including monorepo and `pnpm dlx` usage

## 8. `managedWorkspace` config opt-out

- [x] 8.1 Add `managedWorkspace?: boolean` to `SkuConfigBase` in `packages/sku/src/types/types.ts`, defaulting to `true`. JSDoc covers that `false` skips the `sku lint` pnpm workspace check and the `sku format` sync
- [x] 8.2 Gate the "pnpm workspace" check in `packages/sku/src/program/commands/lint/lint.action.ts` and the sync in `packages/sku/src/program/commands/format/format.action.ts` on the sku config's `managedWorkspace !== false` (available via `skuContext`). The skip is silent: no output, no write, no failure — including no `pnpm-plugin-sku` migration failure
- [x] 8.3 Add integration coverage in `tests/node/pnpm-workspace-config.test.ts`: opted-out lint passes on a drifted file (including `pnpm-plugin-sku` presence) with no workspace output; opted-out format writes nothing; default (unset) behaviour is unchanged; `sku configure workspace` is not gated by the option
- [x] 8.4 Update the changeset (`.changeset/static-pnpm-workspace-config.md`) with the `managedWorkspace` opt-out: lint/format-only scope, default `true`, and that the subcommand is not gated
- [x] 8.5 Update docs (`site/docs/cli.md` and the configuration page) with the `managedWorkspace` option
