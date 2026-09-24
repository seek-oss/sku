## Why

Sku injects its recommended pnpm settings at runtime through `pnpm-plugin-sku`, a pnpm config dependency.

This causes several problems:

- Tools that read `pnpm-workspace.yaml` statically cannot see runtime-injected config.
- Renovate cannot handle the lockfile checksums that config plugins generate. Every Renovate branch needs a manual `pnpm install`.
- The plugin forces version-gated install logic (`isAtLeastPnpmV10`, `pnpm add --config`). It also needs a runtime detection workaround (`pnpm config get --json`, pnpm#9797).
- The plugin-missing warning misfires in monorepos. It always shows, so users learn to ignore it.
- Two packages own the settings. Consumers must update the pinned `pnpm-plugin-sku` separately from sku.

Sku writes the config into `pnpm-workspace.yaml` as static text. Tools can then read it. Sku owns the sync directly. Updating sku is the only upgrade step.

The project's own config then shows sku's recommended values, so users will not add conflicting values by accident.

This ships as a **major, breaking** release. `sku lint` gains a check that fails projects whose file has drifted from sku's recommendations, and `sku format` rewrites a committed config file. A non-breaking release could not enforce either without silently rewriting user-set values on a minor upgrade. Enforcement is therefore the only behaviour. `sku lint` and `sku format` are the entry points for project-level sync, with an explicit `sku configure workspace` subcommand extending the sync to monorepo workspace roots.

## What Changes

**BREAKING**: `sku lint` gains a `pnpm-workspace.yaml` check that did not exist before. Projects whose file has drifted from sku's recommended settings, including projects still using `pnpm-plugin-sku`, fail lint until they run `sku format` once and commit the result.

The sync itself is new. It runs as a read-only check on `sku lint` and as an enforcing write on `sku format`. A new explicit `sku configure workspace` subcommand runs the sync against the workspace root, for monorepos. No other sku command, postinstall, or bare `sku configure` runs it.

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
      Failures name the key and the current and recommended states. The lint output directs the user to `sku format` once at the end of the run.
  - Sku logs user-managed values that differ from its defaults as info. The log names the key, the current value, and the recommended value. It names the two re-alignment paths: edit the value manually, or remove it and let the next `sku format` add it again as managed. These logs never fail the run.
  - An aligned file passes silently.
- A new `sku configure workspace` subcommand syncs the `pnpm-workspace.yaml` at the workspace root (the lockfile root). This makes the sync accessible to monorepos, where the file lives above the package directory.
  It works identically from the workspace root and from any package directory within the workspace. It is self-contained, so it runs through `pnpm dlx`. It needs no sku project dependency and no sku config file, and it emits no other configuration files.
  When the workspace root has no file, it creates one with sku's recommended settings — explicitly configuring a workspace is an opt-in, unlike the implicit lint and format entry points.
  Its `--check` flag runs the read-only check against the workspace root, giving monorepos a CI gate. Check failures direct the user to `sku configure workspace`, not `sku format`. The check fails when the file is missing, since the write mode would create it.
- On `sku lint` and `sku format`, the sync never creates `pnpm-workspace.yaml`.
  Config dependencies can only be declared in `pnpm-workspace.yaml`. A project without the file never had `pnpm-plugin-sku`. Creating the file from an implicit entry point would impose sku's pnpm policy on projects that never opted in. It would also newly mark the directory as a workspace root.
  The explicit `sku configure workspace` subcommand is the exception: it creates the file at the workspace root, because explicitly configuring a workspace is an opt-in.
- `sku format` removes `pnpm-plugin-sku` from `configDependencies` in `pnpm-workspace.yaml` when it is present. This migrates existing projects. Its presence fails `sku lint`.
  The package itself stays in the monorepo and on npm. It may return once tooling works with it better.
- Sku removes the pnpm v10 plugin gate in create's `installDependencies`.
  Create no longer has its own `pnpm-workspace.yaml` writer. It runs the same sync that `sku format` uses. Create permits file creation, because scaffolding a new project is an explicit opt-in. Create runs this before dependency installation.
- Sku removes the runtime merge validation (`validatePnpmConfig`, `getPnpmConfigDependencies`).
  No pnpm version gate replaces it. pnpm 9 and 10 silently ignore unknown keys in `pnpm-workspace.yaml`. pnpm 11 and 12 print a warning that names unrecognized settings, then ignore them.
  Settings take effect when the project's pnpm understands them.
- The new sync is not gated by `skuSkipConfigure` or `skuSkipPostInstall`. Those flags gated the old configure-time plugin validation, which this change removes.
  A new `managedWorkspace` sku config option (default `true`) is the wholesale opt-out: `false` skips the lint check and format write entirely, for projects that keep their `pnpm-workspace.yaml` but self-manage it. It does not gate the `sku configure workspace` subcommand. Otherwise, the per-value marker is the escape hatch.

## Capabilities

### New Capabilities

- `pnpm-workspace-config`: How sku keeps a project's `pnpm-workspace.yaml` aligned with its recommended pnpm settings.
  This covers the lint check, format write, and `sku configure workspace` entry points. It covers uniform marker-based ownership, enforcement, and adoption. It covers lint failure and info behaviour, change logging, the `pnpm-plugin-sku` config dependency migration, and the `managedWorkspace` config opt-out.

### Modified Capabilities

- `create-project`: Create no longer installs `pnpm-plugin-sku` as a config dependency. Create no longer gates on pnpm v10 during install.
  The same sync that `sku format` runs writes the generated `pnpm-workspace.yaml`. Create permits file creation for the new project.

## Impact

- Code:
  - New sync module and shared defaults module in `@sku-private/utils` (bundled into `sku` and `@sku-lib/create`).
    The engine enforces sku's defaults on write and provides a read-only check that reports required changes and user-managed drift without writing.
  - `configureApp` loses the `pnpm-plugin-sku` validation and prompt machinery. The new sync never runs from `configureApp`.
  - The `sku configure` command gains a `workspace` subcommand that runs the sync (or the read-only check, with `--check`) against the lockfile root. The subcommand does not run `configureApp` and requires neither a sku config file nor a project dependency on sku, so it works under `pnpm dlx`.
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
  The migration never rewrites existing unmarked values that differ from sku's defaults. They become user-managed drift. Lint logs them as info.
- Escape hatches: removing a value's `[sku_managed]` marker makes it user-managed. Sku never writes or removes user-managed values. Lint only logs them as info when they differ from sku's defaults.
  A project with no `pnpm-workspace.yaml` is never touched by lint or format. Setting `managedWorkspace: false` in sku config skips the lint check and format write entirely, for projects that keep the file but self-manage it.
- Monorepos: `sku configure workspace` (optionally via `pnpm dlx`) syncs the workspace root's `pnpm-workspace.yaml`, and `sku configure workspace --check` gates on drift in CI. Package-level `sku lint` and `sku format` are unchanged: they never touch an ancestor directory's file.
- Tests:
  - `tests/node/sku-create.test.ts` snapshots lose the `configDependencies` entry.
  - Sku removes `pnpmConfig.test.ts` and its snapshots.
  - Unit tests cover the check and write behaviours, the merge policies, uniform marker ownership, and lint failure/info semantics.
  - Integration tests cover lint failures on managed drift and format's enforcing fixes.
