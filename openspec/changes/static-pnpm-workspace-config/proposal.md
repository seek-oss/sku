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

This ships as a **major, breaking** release.
That frees the sync from the non-breaking constraints that would otherwise force a two-tier design (additive everywhere, enforcing only on `sku configure`): enforcement becomes the only behaviour, and `sku lint`/`sku format` become the only entry points.

## What Changes

**BREAKING**: The sync no longer runs on configuration-enabled sku commands, postinstall, or `sku configure`.
It runs only as a read-only check on `sku lint` and as an enforcing write on `sku format`.

- Sku syncs its recommended pnpm settings into the project's existing `pnpm-workspace.yaml` via `sku format`, using YAML edits that preserve unrelated content:
  - Every value is either sku-managed or user-managed, tracked by a `[sku_managed]` comment marker detected anywhere in a comment.
    This applies uniformly to single-value settings, keys within object settings (currently only `allowBuilds`), and array entries — no setting kind has a fixed owner or an informational-only marker.
  - Sku-managed values are enforced forcefully: missing managed settings and entries are added, marked values that differ from sku's current defaults are rewritten in both directions, and marked entries that sku has retired are removed.
    There is no additive ("soft") mode and no never-downgrade special case: managed means enforced, on every `sku format`.
  - Unmarked values that exactly match sku's current defaults are adopted (marked) on sync, so cleanup works for projects created before markers existed.
    Comments on adopted or overwritten values are replaced with the sku marker (and any sku explanatory comment, for example `# 3 days [sku_managed]`).
  - User-managed (unmarked) values are always preserved.
    Deleting a value's marker is the only per-value opt-out; because a retired entry no longer matches a default it is never re-adopted, so an unmarked retired entry is never removed.
  - Arrays are unioned and deduped; when duplicate values have different ownership the unmarked user-owned entry is retained.
  - Each change is logged.
    An already-aligned file is left untouched and silent.
- `sku lint` checks the file without writing:
  - Managed drift fails the lint run: missing managed settings, marked values that differ from defaults, marked retired entries, unmarked values that match defaults but haven't been adopted yet, and `pnpm-plugin-sku` still present in `configDependencies`.
    Failures name the key and the current and recommended states, and direct the user to `sku format`.
  - User-managed values that differ from sku's defaults are logged as info — naming the key, the current value, the recommended value, and the two re-alignment paths (edit the value manually, or delete it and let the next `sku format` re-add it as managed) — and never fail the run.
  - An aligned file passes silently.
- The sync never creates `pnpm-workspace.yaml`.
  Config dependencies can only be declared in `pnpm-workspace.yaml`, so a project without the file never had `pnpm-plugin-sku`; creating the file would impose sku's pnpm policy on projects that never opted in and would newly mark the directory as a workspace root.
- `pnpm-plugin-sku` is removed from `configDependencies` in `pnpm-workspace.yaml` by `sku format` when present (migration for existing projects), and its presence fails `sku lint`.
  The package itself stays in the monorepo and on npm; it may return once tooling works with it better.
- The pnpm v10 plugin gate in create's `installDependencies` is removed.
  Create no longer has its own `pnpm-workspace.yaml` writer; it runs the same sync that `sku format` uses — with file creation enabled, since scaffolding a new project is an explicit opt-in — before dependency installation.
- The runtime merge validation (`validatePnpmConfig`, `getPnpmConfigDependencies`) is removed.
  No pnpm version gate replaces it: pnpm 9 and 10 silently ignore unknown keys in `pnpm-workspace.yaml`, and pnpm 11 and 12 print a warning naming unrecognized settings before ignoring them.
  Settings take effect when the project's pnpm understands them.
- `skuSkipConfigure` and `skuSkipPostInstall` no longer gate the pnpm-workspace sync — it no longer runs from those paths at all.
  The per-value marker is the only escape hatch.

## Capabilities

### New Capabilities

- `pnpm-workspace-config`: How sku keeps a project's `pnpm-workspace.yaml` aligned with its recommended pnpm settings.
  Covers the lint check and format write entry points, uniform marker-based ownership, enforcement and adoption rules, lint failure and info behaviour, change logging, and the `pnpm-plugin-sku` config dependency migration.

### Modified Capabilities

- `create-project`: Create no longer installs `pnpm-plugin-sku` as a config dependency and no longer gates on pnpm v10 during install.
  The generated `pnpm-workspace.yaml` is written by the same sync that `sku format` runs, with file creation enabled for the new project.

## Impact

- Code:
  - Sync module and shared defaults module in `@sku-private/utils` (bundled into `sku` and `@sku-lib/create`).
    The sync engine loses its mode option — enforcement is the only behaviour — and gains a read-only check that reports required changes and user-managed drift without writing.
  - `configureApp` loses the pnpm-workspace sync and its mode plumbing; the `sku configure` command no longer passes a mode.
  - `sku lint` gains a "pnpm workspace" check; `sku format` gains the enforcing sync step.
  - `packages/create/src/services/install.ts` and `packages/create/src/generators/pnpmWorkspace.ts` are simplified.
  - `packages/sku/src/services/packageManager/pnpmConfig.ts` and `getPnpmConfigDependencies.ts` are removed.
  - `isAtLeastPnpmV10` and `isAtLeastRecommendedPnpmVersion` are removed.
- Dependencies: `yaml` is added to sku's runtime dependencies (already a dependency of `@sku-lib/create`).
  `@sku-lib/create` drops its `pnpm-plugin-sku` dependency.
- Package lifecycle: `pnpm-plugin-sku` stays in the monorepo and remains published, but is no longer installed into projects.
  No npm deprecation or unpublish in this change.
- Consumer projects (**breaking**): after upgrading sku, the first `sku lint` fails until `sku format` is run and the resulting diff — missing settings and markers added, matching values adopted, retired marked entries removed, the `configDependencies` entry removed — is committed.
  This is a one-time, git-reviewable diff per project, and every future sku release that changes defaults propagates the same way: lint fails, format fixes.
  Existing unmarked values that differ from sku's defaults are never rewritten by the migration; they become user-managed drift, info-logged by lint.
- Escape hatch: deleting a value's `[sku_managed]` marker makes it user-managed; user-managed values are never written or removed, only info-logged by lint when they differ from sku's defaults.
  There is no wholesale skip flag for the sync; a project with no `pnpm-workspace.yaml` is never touched (the file is never created).
- Tests:
  - `tests/node/sku-create.test.ts` snapshots lose the `configDependencies` entry.
  - `pnpmConfig.test.ts` and its snapshots are removed.
  - Unit tests cover the check and write behaviours, the merge policies, uniform marker ownership, and lint failure/info semantics.
  - Integration tests cover lint failures on managed drift and format's enforcing fixes.
