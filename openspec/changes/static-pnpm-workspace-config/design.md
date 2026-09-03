## Context

Today, sku's recommended pnpm settings live in `pnpm-plugin-sku`, a pnpm config dependency.
Projects install it via `pnpm add --config pnpm-plugin-sku`, and pnpm merges the defaults into its effective config at runtime via the plugin's `updateConfig` hook.

This has three problems:

1. Tooling blindness: the effective config is computed at runtime.
   Tools that read `pnpm-workspace.yaml` statically (Renovate being the painful one) can't see settings like `minimumReleaseAge`.
2. Machinery: the plugin forces a pnpm v10 gate in create's `installDependencies`, a runtime detection step (`getPnpmConfigDependencies`, working around pnpm#9797), and a persistent `validatePnpmConfig` caution banner.
3. Accidental merge rules: who wins (sku or the user) is decided by sku's `updateConfig` hook, not by pnpm, and the outcome was never chosen per setting.
   Single-value settings are write-if-absent (user wins), objects are plugin-wins per key, and arrays are appended at runtime (can duplicate).
   Each setting inherited whatever the generic merge loop did for its value type, so no deliberate decision exists about who wins for any given key.

`@sku-lib/create` already writes the full config statically into new projects' `pnpm-workspace.yaml` (via `generatePnpmWorkspaceYaml`, importing `pnpm-plugin-sku/config`).
New projects carry both the static file and the plugin.
The plugin's only unique value is propagating updated defaults to existing projects, which this design replaces with direct file sync.

`configureApp` already manages other files in consumer repos on every run (`.gitignore`, `.prettierignore` via `ensure-gitignore`), so a self-healing file sync has an established precedent.
The plugin package is not being deleted: it may return once tooling (such as Renovate) works with runtime-injected config better.
It stays in the monorepo and on npm; it just stops being installed into projects.

A constraint that shapes the whole design: this ships as a **minor, non-breaking release**.
Under the plugin, single-value settings were write-if-absent — a user's file value always won — so silently rewriting user-set values on upgrade would be a breaking behaviour change.
Enforcement is therefore opt-in via `sku configure`; the automatic sync only ever adds.

## Goals / Non-Goals

**Goals:**

- Sku's recommended pnpm settings are written statically into existing `pnpm-workspace.yaml` files and kept in sync on every sku command and postinstall, through a single code path.
- The automatic sync is non-breaking: strictly additive, never overwrites or removes existing values, and never creates the file.
- New defaults propagate to existing projects automatically on sku upgrades, as additions only.
- Drift from sku's defaults (differing managed values, retired sku-owned entries) is surfaced via warnings that point at `sku configure`.
- `sku configure` runs the enforcing sync: managed values overwritten, retired sku-owned entries removed.
- All changes are logged. An already-aligned file is untouched and silent.
- Existing comments and unrelated keys in `pnpm-workspace.yaml` are preserved.
- `pnpm-plugin-sku` is removed from consumer projects (`configDependencies` entry stripped) and the v10/plugin validation machinery is deleted.
- No new runtime dependencies beyond `yaml` (already used by `@sku-lib/create`).

**Non-Goals:**

- Automatic enforcement of managed values.
  Overwriting existing values happens only on explicit `sku configure`.
- Never-downgrade or strength ordering for `trustPolicy` or `minimumReleaseAge`, even on `sku configure`. Rejected; managed means enforced, full stop.
- Per-key opt-outs in config. The opt-outs are `skuSkipConfigure`, `skuSkipPostInstall`, or deleting an entry's marker.
- Deleting, deprecating, or unpublishing `pnpm-plugin-sku`. The package stays in the monorepo and on npm.
- Creating `pnpm-workspace.yaml` in existing projects that lack one (see the decision below).
- Telling users to run `pnpm install` after migration. pnpm already prompts for install when running commands after pnpm-workspace file changes (or will run an install automatically).

## Decisions

### Decision: Static file sync over runtime plugin

Write settings directly into `pnpm-workspace.yaml` rather than injecting them via a config dependency.

- Over keeping the plugin: the plugin is invisible to static tooling (the core problem) and drags the v10 gate, detection workaround, and validation banner with it.
- Over write-once (create-time only): existing projects would never receive updated defaults.
  Sync-on-every-run restores the propagation the plugin provided, with honest, git-visible diffs.
- Over `pnpm config set` automation: not reliable for writing workspace settings.
  Direct YAML editing gives full control over comments and formatting.

### Decision: Two-tier sync — additive automatic, enforcing on `sku configure`

The same sync runs from `configureProject` (every command), `postinstall`, and the `sku configure` command, in two modes:

- **Additive mode** (every command, postinstall): adds missing managed single-value settings, missing sku-owned keys in object settings, and missing array entries; unions and dedupes arrays; adopts unmarked default-matching entries (marking is additive metadata).
  It never overwrites an existing value, never removes an entry, and never creates the file.
- **Enforce mode** (`sku configure` only): everything additive mode does, plus overwriting managed single-value settings in both directions, per-key alignment of object settings, and removal of retired sku-owned entries.
  Manual invocation is intentional, so enforcement only happens on explicit request.

- Over enforce-everywhere (the original design): under the plugin, single-value settings were write-if-absent, so the user's file value always won.
  Silently rewriting user-set values on a minor upgrade would be a breaking behaviour change.
- Over warn-only (no automatic writes): warnings alone are ignorable — the `validatePnpmConfig` banner proved users learn to ignore banners.
  Additive writes deliver the Renovate fix and default propagation immediately; warnings only cover drift.
- Skip conditions mirror existing behaviour: `configureProject` already skips all of configure when `skuSkipConfigure` is set, postinstall is already gated by `skuSkipPostInstall`, and `sku configure` is a manual, intentional invocation that always syncs.
  No new wiring is needed: the sync lives in `configureApp` and inherits these gates, with the mode passed by the call site.

### Decision: Managed means enforced, no never-downgrade (`sku configure` only)

On `sku configure` — the only enforcing entry point — managed single-value settings are always overwritten with sku's current defaults, in both directions.

- Over never-downgrade for `trustPolicy`/`minimumReleaseAge`: a strength-ordering table is extra machinery with a maintenance burden (pnpm adding new policy values) and a fuzzy fail-safe.
  Simplicity and predictability win: sku enforces org-wide policy on explicit request, and the escape hatch (`skuSkipConfigure`) is documented.
- Because enforcement only runs on `sku configure`, git revert remains a viable day-to-day opt-out: regular commands never re-dirty the working tree.

### Decision: Marker-based ownership for collections

Everything sku writes carries a trailing `# managed by sku` comment: on managed single-value settings (informational), and on each sku-owned entry within object and array settings (load-bearing).

- Collections are managed by ownership.
  Sku-owned (marked) entries are added when new and aligned with current defaults on every sync; they are removed when sku retires them, and only on `sku configure`.
  Unmarked entries are user-owned and always preserved.
  Arrays are deduped after merge.
- Adoption: unmarked entries that exactly match sku's current defaults are marked on every sync.
  Without this, entries written by create's current (marker-less) writer could never be cleaned up.
  The rule is deliberately stateless: the sync never asks who added an entry, only whether it is marked and whether it matches a default.
- Retired entries: the automatic sync leaves retired marked entries in place and warns; `sku configure` removes them and logs the removal.
  Removal is scoped strictly to marked entries: if the user deletes an entry's marker, the entry is user-owned, and because a retired entry no longer matches a default it is never re-adopted — so it is never removed.
  If the user wants to keep a removed entry, they add it back unmarked, and it is preserved thereafter.
  Deleting a marker from an entry that still matches a current default does nothing: the next sync re-marks it.
- Markers never replace existing user comments, so an entry with a user comment is never adopted.
  A file whose values and markers already match sku's defaults is never rewritten.
- Over union-always (never remove): union-always leaks retired sku entries into consumer files forever.
  Markers make ownership explicit, which makes safe removal possible when the user asks for it.
- Over block-level markers: per-entry marking keeps user-added entries in a merged list visually distinct and untouched.
- The object policy assumes a flat map (key → single value), which is all `allowBuilds` is.
  A future nested object setting would need its own merge policy: per-entry markers can't express ownership of a subtree.

### Decision: `yaml` (eemeli) for file manipulation

Comment-preserving Document API, already a runtime dependency of `@sku-lib/create`.
Added as a runtime dependency of `sku`.

- Over a config-management library: the merge policies are opinionated enough that generic merge libraries buy nothing.
- Over `@pnpm/config` for writing: it is a reader/typings package.

### Decision: Defaults live in `@sku-private/utils`

The defaults module (values, per-key policies, marker handling) moves from `pnpm-plugin-sku` into `@sku-private/utils`.
It is bundled into both `sku` and `@sku-lib/create` at build time: a single source of truth for create-time file generation and runtime sync.

- Create does not keep its own `pnpm-workspace.yaml` writer.
  It calls the same sync function the configure step uses — with file creation enabled, since scaffolding is an explicit opt-in — so identical output is guaranteed by construction rather than by keeping two writers in agreement.
- Create still writes the file before dependency installation, for two reasons: sku's settings should apply to the very first install, and the file marks the new project as its own workspace root so pnpm does not resolve it against a parent workspace.
- The sync function therefore takes two call-site options: the mode (additive everywhere; enforce only from the `sku configure` command) and whether file creation is permitted (create only).

### Decision: Never create `pnpm-workspace.yaml` in existing projects

The configure-time sync only runs when `pnpm-workspace.yaml` already exists.

- Config dependencies can only be declared in `pnpm-workspace.yaml`, so a project without the file never had `pnpm-plugin-sku`.
  Creating the file would impose sku's pnpm policy on projects that never opted into it.
- Creating the file also newly marks the directory as a workspace root, changing how pnpm resolves the project.
  Unlike `.gitignore`/`.prettierignore`, this file changes package-manager behaviour, so the configure-time file-creation precedent does not extend to it.
- Create still writes the file for new projects: scaffolding is an explicit opt-in, and the file is wanted before the first install.

### Decision: Plugin migration is part of the sync, and is behaviour-preserving

When the sync finds `pnpm-plugin-sku` in `configDependencies`, it removes the entry (and the `configDependencies` key if emptied) and logs the migration.
This is sku's own entry, not user data.
Leaving it would mean the plugin keeps runtime-merging underneath the static file, and Renovate keeps breaking.

Removing the plugin alongside additive static writes preserves the effective pnpm config:

- Single-value settings: the plugin merged write-if-absent, so file values already won; missing keys get the same defaults the plugin was injecting.
- Arrays: the plugin appended its current entries at runtime; the static union is the same set, deduped.
- Object settings (currently only `allowBuilds`): the one real difference.
  The plugin won per key at runtime; after removal, a conflicting user value in the file wins instead.
  This only affects projects that deliberately overrode a sku-owned key, and it flips behaviour toward the user's stated intent.
  Documented in the changeset.
- Retired plugin entries stop being injected at runtime on upgrade, but marked entries already synced into the file remain until `sku configure` removes them — a conservative freeze, surfaced by the drift warning.

### Decision: Drift warnings

When the automatic sync finds an existing managed value that differs from sku's current default (a managed single-value setting or a sku-owned key in an object setting), or a marked entry that sku has retired, it logs a warning naming the key, the current value, the recommended value, and suggesting `sku configure`.
For retired entries, the warning presents both resolutions: run `sku configure` to remove the entry, or delete its `# managed by sku` marker to keep it as a user-managed entry.
No warning when values align.

- Over silence: drift would otherwise be invisible forever, and enforcement would never discoverable.
- Over failing or blocking: far too aggressive for a non-breaking feature.

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

- Drift persists until users run `sku configure` → Accepted trade-off.
  The drift warning keeps it visible on every run, and enforcement-on-command is the price of a non-breaking release.
- Retired sku-owned entries linger in files until `sku configure` → Same warning path.
  The conservative freeze matches the non-breaking goal.
- Object-setting conflict flip after plugin removal (`allowBuilds` today) → Affects only projects that deliberately overrode a sku-owned key, and flips behaviour toward the user's stated intent.
  Documented in the changeset.
- Sync writes to a committed file on every command → Write only when changed and log every change, so the diff is never a surprise.
  Precedent: `.gitignore`/`.prettierignore` management.
- Adoption marks a user's hand-added entry that duplicates a sku default → Removal only happens on `sku configure`, and only while the entry still carries its marker; deleting the marker or re-adding the entry preserves it.
  Documented in the changeset.
- Renovate or other tools may reformat the file, fighting sku's writer → Use `yaml`'s default formatting and keep edits minimal and idempotent.
  If the parsed content is aligned, don't write.
- Removing `configDependencies` leaves lockfile residue until the next install → pnpm prompts users to install after workspace file changes, so no extra messaging is needed.

## Migration Plan

1. Release sku with the sync as a minor (feature).
   On first run, existing projects get a one-time git-reviewable diff: missing settings and markers added, and the `configDependencies` entry removed.
   No existing values are changed.
2. Create stops installing `pnpm-plugin-sku`; new projects get the static file only.
3. The changeset for the release notes the migration, the drift warnings, the enforcing `sku configure` mode, the object-setting conflict flip, the `skuSkipConfigure` escape hatch, and how to keep a retired entry (delete its marker beforehand, or add it back afterwards).
4. `pnpm-plugin-sku` remains published and in the monorepo; no npm action.

Rollback: projects can restore the `configDependencies` entry and pin the previous sku version.
The static keys are harmless alongside the plugin (the plugin's single-value merge is `??=`, so the file wins).

## Open Questions

None. The two-tier modes, policy table, marker semantics, adoption, drift warnings, no-create rule, and entry-point gating are all decided above.
