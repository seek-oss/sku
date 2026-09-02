## Context

Today, sku's recommended pnpm settings (`allowBuilds`, `minimumReleaseAge`, `trustPolicy`, `publicHoistPattern`, etc.) live in `pnpm-plugin-sku`, a pnpm config dependency.
Projects install it via `pnpm add --config pnpm-plugin-sku`, and pnpm merges the defaults into its effective config at runtime via the plugin's `updateConfig` hook.

This has three problems:

1. Tooling blindness: the effective config is computed at runtime.
   Tools that read `pnpm-workspace.yaml` statically (Renovate being the painful one) can't see settings like `minimumReleaseAge`.
2. Machinery: the plugin forces a pnpm v10 gate in create's `installDependencies`, a runtime detection step (`getPnpmConfigDependencies`, working around pnpm#9797), and a persistent `validatePnpmConfig` caution banner.
3. Accidental merge rules: who wins (sku or the user) is decided by sku's `updateConfig` hook, not by pnpm, and the outcome was never chosen per setting.
   Scalars are write-if-absent (user wins), objects are plugin-wins per key, and arrays are appended at runtime (can duplicate).
   Each setting inherited whatever the generic merge loop did for its value type, so no deliberate decision exists about who wins for any given key.

`@sku-lib/create` already writes the full config statically into new projects' `pnpm-workspace.yaml` (via `generatePnpmWorkspaceYaml`, importing `pnpm-plugin-sku/config`).
New projects carry both the static file and the plugin.
The plugin's only unique value is propagating updated defaults to existing projects, which this design replaces with direct file sync.

`configureApp` already manages other files in consumer repos on every run (`.gitignore`, `.prettierignore` via `ensure-gitignore`), so a self-healing file sync has an established precedent.

The plugin package is not being deleted: it may return once tooling (such as Renovate) works with runtime-injected config better.
It stays in the monorepo and on npm; it just stops being installed into projects.

## Goals / Non-Goals

**Goals:**

- Sku's recommended pnpm settings are written statically into `pnpm-workspace.yaml` and kept in sync on every sku command, postinstall, and `sku configure`, through a single code path.
- Updated defaults propagate to existing projects automatically on sku upgrades, including removal of retired sku-owned entries.
- All changes are logged. An already-aligned file is untouched and silent.
- Existing comments and unrelated keys in `pnpm-workspace.yaml` are preserved.
- `pnpm-plugin-sku` is removed from consumer projects (`configDependencies` entry stripped) and the v10/plugin validation machinery is deleted.
- No new runtime dependencies beyond `yaml` (already used by `@sku-lib/create`).

**Non-Goals:**

- Stale-value detection and nudging (telling users their file has an outdated default vs a custom value). Deferred.
- Never-downgrade or strength ordering for `trustPolicy` or `minimumReleaseAge`. Rejected; managed values are enforced, full stop.
- Per-key opt-outs in config. The opt-outs are `skuSkipConfigure`, `skuSkipPostInstall`, or deleting an entry's marker.
- Deleting, deprecating, or unpublishing `pnpm-plugin-sku`. The package stays in the monorepo and on npm.
- Telling users to run `pnpm install` after migration. pnpm already prompts for install when running commands after pnpm-workspace file changes (or will run an install automatically).

## Decisions

### Decision: Static file sync over runtime plugin

Write settings directly into `pnpm-workspace.yaml` rather than injecting them via a config dependency.

- Over keeping the plugin: the plugin is invisible to static tooling (the core problem) and drags the v10 gate, detection workaround, and validation banner with it.
- Over write-once (create-time only): existing projects would never receive updated defaults.
  Sync-on-every-run restores the propagation the plugin provided, with honest, git-visible diffs.
- Over `pnpm config set` automation: not reliable for writing workspace settings.
  Direct YAML editing gives full control over comments and formatting.

### Decision: Single sync mode on all entry points

The same sync runs from `configureProject` (every command), `postinstall`, and the `sku configure` command.
There is no separate forceful mode.

- Skip conditions mirror existing behaviour: `configureProject` already skips all of configure when `skuSkipConfigure` is set, postinstall is already gated by `skuSkipPostInstall`, and `sku configure` is a manual, intentional invocation that always syncs.
  No new wiring is needed: the sync lives in `configureApp` and inherits these gates.

### Decision: Managed means enforced, no never-downgrade

Managed scalar/enum values (`blockExoticSubdeps`, `minimumReleaseAge`, `strictDepBuilds`, `trustPolicy`) are always overwritten with sku's current defaults, in both directions.

- Over never-downgrade for `trustPolicy`/`minimumReleaseAge`: a strength-ordering table is extra machinery with a maintenance burden (pnpm adding new policy values) and a fuzzy fail-safe.
  Simplicity and predictability win: sku enforces org-wide policy, and the escape hatch (`skuSkipConfigure`) is documented.
- Consequence: git revert is not a viable opt-out for managed keys, since the next command re-dirties the working tree.
  This is deliberate.

### Decision: Marker-based ownership for collections

Everything sku writes carries a trailing `# managed by sku` comment: on managed scalars (informational), and on each sku-owned entry within `allowBuilds` and the array settings (load-bearing).

- Collections are reconciled by ownership.
  Sku-owned (marked) entries are added when new, aligned with current defaults, and removed when sku retires them.
  Unmarked entries are user-owned and always preserved.
  Arrays are deduped after merge.
- Adoption: unmarked entries that exactly match sku's current defaults are marked on every sync.
  Without this, entries written by create's current (marker-less) writer could never be cleaned up.
  The rule is deliberately stateless: the sync never asks who added an entry, only whether it is marked and whether it matches a default.
- Keeping a retired entry: if sku retires an entry a user wants, the sync removes it once and logs the removal.
  The user adds it back, and because it no longer matches a default it is never adopted or removed again.
  Deleting a marker from an entry that still matches a current default does nothing: the next sync re-marks it.
- Markers never replace existing user comments, so an entry with a user comment is never adopted.
  A file whose values and markers already match sku's defaults is never rewritten.
- Over union-always (never remove): union-always leaks retired sku entries into consumer files forever.
  Markers make ownership explicit, which makes safe removal possible.
- Over block-level markers: per-entry marking keeps user-added entries in a merged list visually distinct and untouched.

### Decision: `yaml` (eemeli) for file manipulation

Comment-preserving Document API, already a runtime dependency of `@sku-lib/create`.
Added as a runtime dependency of `sku`.

- Over a config-management library: the merge policies are opinionated enough that generic merge libraries buy nothing.
- Over `@pnpm/config` for writing: it is a reader/typings package.

### Decision: Defaults live in `@sku-private/utils`

The defaults module (values, per-key policies, marker handling) moves from `pnpm-plugin-sku` into `@sku-private/utils`.
It is bundled into both `sku` and `@sku-lib/create` at build time: a single source of truth for create-time file generation and runtime sync.

- Create does not keep its own `pnpm-workspace.yaml` writer.
  It calls the same sync function the configure step uses, so identical output is guaranteed by construction rather than by keeping two writers in agreement.
- Create still writes the file before dependency installation, for two reasons: sku's settings should apply to the very first install, and the file marks the new project as its own workspace root so pnpm does not resolve it against a parent workspace.

### Decision: Plugin migration is part of the sync

When the sync finds `pnpm-plugin-sku` in `configDependencies`, it removes the entry (and the `configDependencies` key if emptied) and logs the migration.
This is sku's own entry, not user data.
Leaving it would mean the plugin keeps runtime-merging underneath the static file.

### Decision: No pnpm version gate

Verified by spike: pnpm 9.15.9, 10.0.0, and 10.13.0 silently ignore unknown keys in `pnpm-workspace.yaml`.
Re-tested for this change: pnpm 11.24.0 and 12.2.1 print a warning naming the unrecognized settings, then ignore them.
Installs succeed in every tested version.
Settings take effect when the project's pnpm understands them; older and newer pnpm are unaffected.
`isAtLeastPnpmV10` and `isAtLeastRecommendedPnpmVersion` are removed along with the validation banner.
If a future pnpm turns unknown settings into an error, or removes a setting sku manages, the defaults module may need per-version value sets.
Out of scope for this change.

### Decision: Logging

Every mutation is logged as it happens (for example `added minimumReleaseAge: 4320 to pnpm-workspace.yaml`, `updated minimumReleaseAge: 1440 → 4320`, `removed pnpm-plugin-sku from configDependencies`).
No output when the file is already aligned.

## Risks / Trade-offs

- Always-overwrite fights intentional customization of managed keys → Accepted trade-off.
  The documented escape hatch is `skuSkipConfigure`, and the managed set is deliberately small and focused on security and workflow.
- Sync writes to a committed file on every command → Write only when changed and log every change, so the diff is never a surprise.
  Precedent: `.gitignore`/`.prettierignore` management.
- Projects without a `pnpm-workspace.yaml` (single-package pnpm projects) → The sync creates the file, consistent with configure creating `.gitignore`/`.prettierignore`.
  Only for pnpm projects (`isPnpm` + `rootDir`).
- Adoption marks a user's hand-added entry that duplicates a sku default → One-time removal if sku retires that default.
  The user re-adds it unmarked and it is preserved thereafter.
  Documented in the changeset.
- Renovate or other tools may reformat the file, fighting sku's writer → Use `yaml`'s default formatting and keep edits minimal and idempotent.
  If the parsed content is aligned, don't write.
- Removing `configDependencies` leaves lockfile residue until the next install → pnpm prompts users to install after workspace file changes, so no extra messaging is needed.

## Migration Plan

1. Release sku with the sync.
   On first run, existing projects get a one-time git-reviewable diff: static settings added, updated, and marked, and the `configDependencies` entry removed.
2. Create stops installing `pnpm-plugin-sku`; new projects get the static file only.
3. The changeset for the release notes the migration, the `skuSkipConfigure` escape hatch, and how to restore a retired entry (add it back).
4. `pnpm-plugin-sku` remains published and in the monorepo; no npm action.

Rollback: projects can restore the `configDependencies` entry and pin the previous sku version.
The static keys are harmless alongside the plugin (plugin scalar merge is `??=`, file wins).

## Open Questions

None. The policy table, marker semantics, adoption, and entry-point gating are all decided above.
