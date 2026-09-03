## Why

Sku injects its recommended pnpm settings at runtime via `pnpm-plugin-sku`, a pnpm config dependency.
This causes several problems:

- Runtime-injected config is invisible to tooling that reads `pnpm-workspace.yaml` statically.
- Renovate can't handle the lockfile checksums config plugins generate, so every Renovate branch needs a manual `pnpm install`.
- The plugin forces version-gated install logic (`isAtLeastPnpmV10`, `pnpm add --config`) and a runtime detection workaround (`pnpm config get --json`, pnpm#9797).
- The plugin-missing warning misfires in monorepos, so it always shows and users learn to ignore it.
- Settings are owned across two packages: consumers must update the pinned `pnpm-plugin-sku` separately from sku.

Writing the config statically into `pnpm-workspace.yaml` fixes all of this: tooling can see it, sku owns the sync directly, and updating sku is the only upgrade step.
It also makes sku's recommended values visible in the project's own config, so users won't unknowingly add conflicting values.

## What Changes

This is a non-breaking feature release.
The automatic sync is strictly additive: it never overwrites or removes existing values, and never creates `pnpm-workspace.yaml`.

- Sku syncs its recommended pnpm settings into the project's existing `pnpm-workspace.yaml` whenever `configureApp` runs (every sku command and postinstall), using comment-preserving YAML edits:
  - Missing managed single-value settings are added with sku's current defaults.
    Existing values are never overwritten by the automatic sync.
  - Missing sku-owned keys in object settings (currently only `allowBuilds`) are added.
    Existing keys keep their values.
  - Array values are unioned: missing sku entries are appended, user entries are preserved, and the result is deduped.
  - Ownership is tracked with trailing `# managed by sku` comment markers on sku-written values and sku-owned collection entries.
    Unmarked entries that exactly match sku's current defaults are adopted (marked) on sync, so cleanup works for projects created before markers existed.
  - When an existing value drifts from sku's defaults — a differing managed setting or object-setting value, or a marked entry sku has retired — the sync logs a warning naming the key and both values and points at `sku configure`.
  - Each change is logged.
    An already-aligned file is left untouched and silent.
- `sku configure` runs the full enforcing sync: managed single-value settings are overwritten with sku's current defaults in both directions (managed means enforced; no never-downgrade or strength-ordering special cases), sku-owned keys in object settings are aligned with sku's defaults, and retired sku-owned entries are removed.
  Manual invocation is intentional, so enforcement only happens on explicit request.
  Removal is scoped strictly to entries still carrying a `# managed by sku` marker: if the user deletes an entry's marker it becomes user-owned, and because a retired entry no longer matches a default it is never re-adopted, so it is never removed.
  If the enforcing sync removes a retired entry a user wants to keep, they can add it back unmarked and it is preserved thereafter.
- The sync never creates `pnpm-workspace.yaml`.
  Config dependencies can only be declared in `pnpm-workspace.yaml`, so a project without the file never had `pnpm-plugin-sku`; creating the file would impose sku's pnpm policy on projects that never opted in and would newly mark the directory as a workspace root.
- `pnpm-plugin-sku` is removed from `configDependencies` in `pnpm-workspace.yaml` when present (migration for existing projects).
  This is behaviour-preserving: the static values the sync writes are the values the plugin injected at runtime, so the effective pnpm config is unchanged.
  The package itself stays in the monorepo and on npm; it may return once tooling works with it better.
- The pnpm v10 plugin gate in create's `installDependencies` is removed.
  Create no longer has its own `pnpm-workspace.yaml` writer; it runs the same sync used at configure time — with file creation enabled, since scaffolding a new project is an explicit opt-in — before dependency installation.
- The runtime merge validation (`validatePnpmConfig`, `getPnpmConfigDependencies`) is removed.
  No pnpm version gate replaces it: pnpm 9 and 10 silently ignore unknown keys in `pnpm-workspace.yaml`, and pnpm 11 and 12 print a warning naming unrecognized settings before ignoring them.
  Settings take effect when the project's pnpm understands them.

## Capabilities

### New Capabilities

- `pnpm-workspace-config`: How sku keeps a project's `pnpm-workspace.yaml` aligned with its recommended pnpm settings.
  Covers the sync trigger points and skip conditions, the additive automatic mode and enforcing `sku configure` mode, marker-based ownership and adoption, drift warnings, change logging, and the `pnpm-plugin-sku` config dependency migration.

### Modified Capabilities

- `create-project`: Create no longer installs `pnpm-plugin-sku` as a config dependency and no longer gates on pnpm v10 during install.
  The generated `pnpm-workspace.yaml` is written by the same sync that runs at configure time, with file creation enabled for the new project.

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
- Consumer projects: on first run of an upgraded sku, `pnpm-workspace.yaml` gains any missing static settings and markers and loses the `configDependencies` entry.
  No existing values are changed.
  This is a one-time, git-reviewable diff, released as a minor.
- Escape hatches:
  - `skuSkipConfigure` in package.json disables the sync on regular sku commands.
  - `skuSkipPostInstall` disables the postinstall run.
  - `sku configure` always syncs, and is the only entry point that enforces (manual invocation is intentional).
  - A retired entry is only removed while it carries its marker; delete the marker (or re-add the entry afterwards) to keep it.
- Tests:
  - `tests/node/sku-create.test.ts` snapshots lose the `configDependencies` entry.
  - `pnpmConfig.test.ts` and its snapshots are removed.
  - New unit tests cover both sync modes, the merge policies, marker handling, and drift warnings.
