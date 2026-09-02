## Why

Sku manages recommended pnpm settings via `pnpm-plugin-sku`, a pnpm config dependency that merges defaults into pnpm's config at runtime.
Runtime-injected config is invisible to tooling that reads `pnpm-workspace.yaml` statically (including Renovate).
The plugin mechanism also forces version-gated install logic (`isAtLeastPnpmV10`, `pnpm add --config`), a runtime detection workaround (`pnpm config get --json`, pnpm#9797), and a persistent validation banner.
And it splits ownership of the settings across two packages: when sku changes its recommended settings, consumers must update the pinned `pnpm-plugin-sku` config dependency separately from sku itself.
Writing the config statically into `pnpm-workspace.yaml` makes it visible to all tooling and lets sku own the file's sync directly, so updating sku is the only upgrade step.

## What Changes

- Sku syncs its recommended pnpm settings directly into the project's `pnpm-workspace.yaml` whenever `configureApp` runs (every sku command, postinstall, and `sku configure`), using comment-preserving YAML edits:
  - Managed scalar/enum values (`blockExoticSubdeps`, `minimumReleaseAge`, `strictDepBuilds`, `trustPolicy`) are always overwritten with sku's current defaults, in both directions.
    There are no never-downgrade or strength-ordering special cases: managed means enforced.
  - Managed `allowBuilds` keys that sku owns are reconciled (added when new, overwritten, removed when retired).
    User-added keys are preserved.
  - Array values (`minimumReleaseAgeExclude`, `publicHoistPattern`, `trustPolicyExclude`) are reconciled for sku-owned entries and unioned for user entries.
    Sku-owned entries are added when new and removed when retired.
    User-added entries are always preserved, and the result is deduped.
  - Ownership is tracked with trailing `# managed by sku` comment markers on sku-written values and sku-owned collection entries.
    Unmarked entries that exactly match sku's current defaults are always adopted (marked) on sync, so cleanup works for projects created before markers existed.
    If sku retires an entry a user wants to keep, they can add it back: it no longer matches a default, so it stays user-owned and is never reconciled again.
  - Each change is logged.
    An already-aligned file is left untouched and silent.
- **BREAKING**: `pnpm-plugin-sku` is no longer installed as a config dependency.
  The sync removes `pnpm-plugin-sku` from `configDependencies` in `pnpm-workspace.yaml` when present (migration for existing projects).
  The package itself stays in the monorepo and on npm; it may return once tooling works with it better.
- The pnpm v10 plugin gate in create's `installDependencies` is removed.
  Create no longer has its own `pnpm-workspace.yaml` writer; it runs the same sync used at configure time, before dependency installation.
- The runtime merge validation (`validatePnpmConfig`, `getPnpmConfigDependencies`) is removed.
  No pnpm version gate replaces it: pnpm 9 and 10 silently ignore unknown keys in `pnpm-workspace.yaml`, and pnpm 11 and 12 print a warning naming unrecognized settings before ignoring them.
  Settings take effect when the project's pnpm understands them.
- If a pnpm project has no `pnpm-workspace.yaml`, the sync creates it, consistent with configure creating `.gitignore` and `.prettierignore`.

## Capabilities

### New Capabilities

- `pnpm-workspace-config`: How sku keeps a project's `pnpm-workspace.yaml` aligned with its recommended pnpm settings.
  Covers the sync trigger points and skip conditions, the managed/reconciled/unioned merge policies, marker-based ownership and adoption, change logging, and the `pnpm-plugin-sku` config dependency migration.

### Modified Capabilities

- `create-project`: Create no longer installs `pnpm-plugin-sku` as a config dependency and no longer gates on pnpm v10 during install.
  The generated `pnpm-workspace.yaml` is written by the same sync that runs at configure time.

## Impact

- Code:
  - New sync module and shared defaults module in `@sku-private/utils` (bundled into `sku` and `@sku-lib/create`).
  - `configureApp` gains a sync step replacing the plugin validation step.
  - `packages/create/src/services/install.ts` and `packages/create/src/generators/pnpmWorkspace.ts` are simplified.
  - `packages/sku/src/services/packageManager/pnpmConfig.ts` and `getPnpmConfigDependencies.ts` are removed.
  - `isAtLeastPnpmV10` and `isAtLeastRecommendedPnpmVersion` are removed.
- Dependencies: `yaml` is added to sku's runtime dependencies (already a dependency of `@sku-lib/create`).
  `@sku-lib/create` drops its `pnpm-plugin-sku` dependency.
- Package lifecycle: `pnpm-plugin-sku` stays in the monorepo and remains published, but is no longer installed into projects.
  No npm deprecation or unpublish in this change.
- Consumer projects: on first run of an upgraded sku, `pnpm-workspace.yaml` gains the static settings block and loses the `configDependencies` entry.
  This is a one-time, git-reviewable diff.
- Escape hatches:
  - `skuSkipConfigure` in package.json disables the sync on regular sku commands.
  - `skuSkipPostInstall` disables the postinstall run.
  - `sku configure` always syncs (manual invocation is intentional).
  - A retired entry that was removed can be re-added by the user; it is then preserved.
- Tests:
  - `tests/node/sku-create.test.ts` snapshots lose the `configDependencies` entry.
  - `pnpmConfig.test.ts` and its snapshots are removed.
  - New unit tests cover the sync merge policies and marker handling.
