## Why

Sku injects its recommended pnpm settings at runtime through `pnpm-plugin-sku`, a pnpm config dependency.

This causes several problems:

- Tools that read `pnpm-workspace.yaml` statically cannot see runtime-injected config.
- Renovate cannot handle the lockfile checksums that config plugins generate. Every Renovate branch needs a manual `pnpm install`.
- The plugin forces version-gated install logic (`isAtLeastPnpmV10`, `pnpm add --config`). It also needs a runtime detection workaround (`pnpm config get --json`, pnpm#9797).
- The plugin-missing warning misfires in monorepos. It always shows, so users learn to ignore it.
- Two packages own the settings. Consumers must update the pinned `pnpm-plugin-sku` separately from sku.

Sku writes the config into `pnpm-workspace.yaml` as static text. Tools can then read it. Sku owns the sync directly. Updating sku is the only upgrade step.

The project's own config then shows sku's recommended values. Users will not add conflicting values without knowing.

This ships as a **major, breaking** release.

A non-breaking release would force a two-tier design: additive everywhere, enforcing only on `sku configure`. The major release removes that constraint. Enforcement becomes the only behaviour. `sku lint` and `sku format` become the only entry points.

## What Changes

**BREAKING**: The sync no longer runs on configuration-enabled sku commands, postinstall, or `sku configure`.

It runs only as a read-only check on `sku lint`. It runs as an enforcing write on `sku format`.

- Sku writes its recommended pnpm settings into the project's existing `pnpm-workspace.yaml` through `sku format`. The YAML edits preserve unrelated content.
  - Every value is either sku-managed or user-managed. A `[sku_managed]` comment marker tracks ownership. Sku detects the marker anywhere in a comment.
    This rule applies to single-value settings, keys within object settings (currently only `allowBuilds`), and array entries. No setting kind has a fixed owner. No marker is informational only.
  - Sku enforces sku-managed values. It adds missing managed settings and entries. It rewrites marked values that differ from sku's current defaults, in both directions. It removes marked entries that sku retired.
    There is no additive ("soft") mode. There is no never-downgrade special case. Managed means enforced, on every `sku format`.
  - Sku adopts unmarked values that exactly match its current defaults. It marks them on sync. Cleanup then works for projects created before markers existed.
    Sku replaces comments on adopted or overwritten values with the sku marker and any sku explanatory comment, for example `# 3 days [sku_managed]`.
  - Sku always preserves user-managed (unmarked) values.
    Removing a value's marker is the only per-value opt-out. A retired entry no longer matches a default, so sku never adopts it again. Sku never removes an unmarked retired entry.
  - Sku unions and dedupes arrays. When duplicate values have different ownership, sku retains the unmarked user-owned entry.
  - Sku logs each change.
    Sku leaves an already-aligned file untouched and silent.
- `sku lint` checks the file without writing:
  - Managed drift fails the lint run. Failures include:
    - missing managed settings
    - marked values that differ from defaults
    - marked retired entries
    - unmarked values that match defaults but are not yet adopted
    - `pnpm-plugin-sku` still present in `configDependencies`
      Failures name the key and the current and recommended states. They direct the user to `sku format`.
  - Sku logs user-managed values that differ from its defaults as info. The log names the key, the current value, and the recommended value. It names the two re-alignment paths: edit the value manually, or remove it and let the next `sku format` add it again as managed. These logs never fail the run.
  - An aligned file passes silently.
- The sync never creates `pnpm-workspace.yaml`.
  Config dependencies can only be declared in `pnpm-workspace.yaml`. A project without the file never had `pnpm-plugin-sku`. Creating the file would impose sku's pnpm policy on projects that never opted in. It would also newly mark the directory as a workspace root.
- `sku format` removes `pnpm-plugin-sku` from `configDependencies` in `pnpm-workspace.yaml` when it is present. This migrates existing projects. Its presence fails `sku lint`.
  The package itself stays in the monorepo and on npm. It may return once tooling works with it better.
- Sku removes the pnpm v10 plugin gate in create's `installDependencies`.
  Create no longer has its own `pnpm-workspace.yaml` writer. It runs the same sync that `sku format` uses. Create permits file creation, because scaffolding a new project is an explicit opt-in. Create runs this before dependency installation.
- Sku removes the runtime merge validation (`validatePnpmConfig`, `getPnpmConfigDependencies`).
  No pnpm version gate replaces it. pnpm 9 and 10 silently ignore unknown keys in `pnpm-workspace.yaml`. pnpm 11 and 12 print a warning that names unrecognized settings, then ignore them.
  Settings take effect when the project's pnpm understands them.
- `skuSkipConfigure` and `skuSkipPostInstall` no longer gate the pnpm-workspace sync. The sync no longer runs from those paths at all.
  The per-value marker is the only escape hatch.

## Capabilities

### New Capabilities

- `pnpm-workspace-config`: How sku keeps a project's `pnpm-workspace.yaml` aligned with its recommended pnpm settings.
  This covers the lint check and format write entry points. It covers uniform marker-based ownership, enforcement, and adoption. It covers lint failure and info behaviour, change logging, and the `pnpm-plugin-sku` config dependency migration.

### Modified Capabilities

- `create-project`: Create no longer installs `pnpm-plugin-sku` as a config dependency. Create no longer gates on pnpm v10 during install.
  The same sync that `sku format` runs writes the generated `pnpm-workspace.yaml`. Create permits file creation for the new project.

## Impact

- Code:
  - Sync module and shared defaults module in `@sku-private/utils` (bundled into `sku` and `@sku-lib/create`).
    The sync engine loses its mode option. Enforcement is the only behaviour. The engine gains a read-only check that reports required changes and user-managed drift without writing.
  - `configureApp` loses the pnpm-workspace sync and its mode plumbing. The `sku configure` command no longer passes a mode.
  - `sku lint` gains a "pnpm workspace" check. `sku format` gains the enforcing sync step.
  - Sku simplifies `packages/create/src/services/install.ts` and `packages/create/src/generators/pnpmWorkspace.ts`.
  - Sku removes `packages/sku/src/services/packageManager/pnpmConfig.ts` and `getPnpmConfigDependencies.ts`.
  - Sku removes `isAtLeastPnpmV10` and `isAtLeastRecommendedPnpmVersion`.
- Dependencies: Sku adds `yaml` to sku's runtime dependencies (already a dependency of `@sku-lib/create`).
  `@sku-lib/create` drops its `pnpm-plugin-sku` dependency.
- Package lifecycle: `pnpm-plugin-sku` stays in the monorepo and remains published. Projects no longer install it.
  This change does not deprecate or unpublish the package on npm.
- Consumer projects (**breaking**): after upgrading sku, the first `sku lint` fails until the user runs `sku format` and commits the resulting diff. The diff adds missing settings and markers. It adopts matching values. It removes retired marked entries. It removes the `configDependencies` entry.
  This is a one-time, git-reviewable diff per project. Every future sku release that changes defaults propagates the same way: lint fails, format fixes.
  Existing unmarked values that differ from sku's defaults are never rewritten by the migration. They become user-managed drift. Lint logs them as info.
- Escape hatch: removing a value's `[sku_managed]` marker makes it user-managed. Sku never writes or removes user-managed values. Lint only logs them as info when they differ from sku's defaults.
  There is no wholesale skip flag for the sync. A project with no `pnpm-workspace.yaml` is never touched. The sync never creates the file.
- Tests:
  - `tests/node/sku-create.test.ts` snapshots lose the `configDependencies` entry.
  - Sku removes `pnpmConfig.test.ts` and its snapshots.
  - Unit tests cover the check and write behaviours, the merge policies, uniform marker ownership, and lint failure/info semantics.
  - Integration tests cover lint failures on managed drift and format's enforcing fixes.
