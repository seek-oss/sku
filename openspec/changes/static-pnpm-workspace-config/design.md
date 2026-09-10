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

The plugin package is not being deleted: it may return once tooling (such as Renovate) works with runtime-injected config better.
It stays in the monorepo and on npm; it just stops being installed into projects.

The constraint that shapes the whole design: this ships as a **major, breaking release**.
(This change was originally planned as a non-breaking minor with a two-tier sync — additive on every command, enforcing only on `sku configure` — and was revised in place before release.
The two-tier split existed only to avoid silently rewriting user-set values on a minor upgrade; the major removes that constraint.)
Enforcement is therefore unconditional for sku-managed values, and the sync's only entry points are `sku lint` (check) and `sku format` (write) — the commands users already expect to check and fix their repos.

## Goals / Non-Goals

**Goals:**

- Sku's recommended pnpm settings are written statically into existing `pnpm-workspace.yaml` files and kept in sync through a single code path, surfaced exclusively via `sku lint` (read-only check) and `sku format` (enforcing write).
- Enforcement is unconditional for sku-managed values: missing values are added, drifted marked values are rewritten in both directions, and retired marked entries are removed, on every `sku format`.
- `sku lint` fails on any managed drift — including missing managed keys, pending adoptions, retired marked entries, and a lingering `pnpm-plugin-sku` config dependency — directing users to `sku format`.
- Uniform ownership: the `[sku_managed]` marker is load-bearing for every value kind, including single-value settings.
  Unmarked values are user-managed and always preserved.
- User-managed drift (unmarked values differing from sku's defaults) is surfaced as lint info, never failing the run.
- All changes are logged. An already-aligned file is untouched and silent.
- Unmanaged keys and user-managed entries in `pnpm-workspace.yaml` are preserved.
  Comments on values that become sku-managed are replaced by the sku marker.
- `pnpm-plugin-sku` is removed from consumer projects (`configDependencies` entry stripped by `sku format`) and the v10/plugin validation machinery is deleted.
- No new runtime dependencies beyond `yaml` (already used by `@sku-lib/create`).

**Non-Goals:**

- Syncing on any command other than `sku lint` and `sku format`.
  Postinstall and `sku configure` no longer run the sync.
- Never-downgrade or strength ordering for `trustPolicy` or `minimumReleaseAge`. Rejected; managed means enforced, full stop.
- Wholesale skip flags for the sync. `skuSkipConfigure` and `skuSkipPostInstall` gated the old configure-time path and no longer apply; the per-value marker is the only opt-out.
- A negative marker (for example `[user_managed]`) to pre-emptively pin values that currently match sku's defaults.
  See the silent-pin trade-off in the ownership decision.
- Deleting, deprecating, or unpublishing `pnpm-plugin-sku`. The package stays in the monorepo and on npm.
- Creating `pnpm-workspace.yaml` in existing projects that lack one (see the decision below).
- Telling users to run `pnpm install` after migration. pnpm already prompts for install when running commands after pnpm-workspace file changes (or will run an install automatically).

## Decisions

### Decision: Static file sync over runtime plugin

Write settings directly into `pnpm-workspace.yaml` rather than injecting them via a config dependency.

- Over keeping the plugin: the plugin is invisible to static tooling (the core problem) and drags the v10 gate, detection workaround, and validation banner with it.
- Over write-once (create-time only): existing projects would never receive updated defaults.
  Lint-gated sync restores the propagation the plugin provided, with honest, git-visible diffs.
- Over `pnpm config set` automation: not reliable for writing workspace settings.
  Direct YAML editing gives full control over comments and formatting.

### Decision: Check/fix split on lint and format

The sync runs in exactly two places: `sku lint` as a read-only check, and `sku format` as an enforcing write.
The lint check joins the existing `runLintChecks` list (alongside TypeScript, Prettier, and ESLint) as a "pnpm workspace" check; the format step joins ESLint fix and Prettier write.
This mirrors the check/write mental model Prettier already gives users.

- Over sync-on-every-command (the original minor design): lint and format already run in CI and locally, so they are the natural enforcement surface.
  Other commands should not mutate a committed config file as a side effect — and postinstall writes are effectively invisible, since users don't expect file changes during install.
- Over keeping enforcement on `sku configure`: a manual command nobody runs can't enforce anything.
  A lint failure forces the issue exactly once per drift event, in the place CI already gates.
- The engine splits into computing required changes (pure) and applying them, so lint's check is the same logic as format's write, with no mode threading through the sync helpers.
  The check reports two channels: required managed changes (fail) and user-managed drift advisories (info).
- Consequence, accepted: every sku release that changes defaults fails CI lint fleet-wide until each project runs `sku format` and commits.
  This is the propagation mechanism replacing the plugin's runtime injection — the major bump makes it explicit, and the fix is always the same one command.

### Decision: Uniform marker-based ownership

Everything sku writes carries a `[sku_managed]` marker at the end of its comment, after any explanatory text (`# 3 days [sku_managed]`).
The marker is load-bearing for every value kind — single-value settings, object-setting keys, and array entries alike.
Detection matches the marker anywhere in a comment, so a user can annotate a marked value without losing sku ownership.

- Marked values are sku-managed: added when missing, rewritten when drifted (in both directions), removed when retired — on every `sku format`.
- Unmarked values are user-managed: always preserved, never written or removed.
  Deleting a value's marker is the only per-value opt-out.
- Adoption: unmarked values that exactly match sku's current defaults are marked on `sku format`, and their pending adoption fails `sku lint`.
  Without adoption, projects created by the marker-less writer would keep every value user-managed forever, and default changes would never propagate to them.
  The rule is deliberately stateless: the sync never asks who added a value, only whether it is marked and whether it matches a default.
- Re-alignment path for user-managed drift: edit the value to match sku's default (the next format adopts it), or delete the value entirely and let the next `sku format` re-add it as managed.
- Accepted trap (silent pins): a value matching today's default can't be pre-emptively pinned — adoption marks it, and a future default change rewrites it forcefully.
  Pinning is only possible after sku diverges, by deleting the marker then.
  Accepted: sku's values are the recommendation and consumers are expected to track them; a negative-marker mechanism is machinery for a rare case.
- Retired entries: removal is scoped strictly to marked entries.
  An unmarked retired entry no longer matches a default, so it is never re-adopted and never removed — it is pure user data, and lint stays silent about it.
- When a value is adopted or overwritten, its existing comments are replaced with the sku marker (and any sku explanatory comment).
  A file whose values and markers already match sku's defaults is never rewritten.
- Over fixed ownership per setting kind (the minor design, where single-value markers were informational): one rule for everything is simpler to reason about, and it's what makes user-managed single values — and therefore lint's info channel — coherent.
- Over block-level markers: per-value marking keeps user-added entries in a merged list visually distinct and untouched.
- The object policy assumes a flat map (key → single value), which is all `allowBuilds` is.
  A future nested object setting would need its own merge policy: per-entry markers can't express ownership of a subtree.

### Decision: Lint failures and info advisories

`sku lint` fails when the file requires managed changes: a managed setting or entry is missing, a marked value differs from sku's current default, a marked entry has been retired, an unmarked value matches a default but hasn't been adopted, or `pnpm-plugin-sku` is present in `configDependencies`.
Failures name the key, the current and recommended states, and direct the user to `sku format`.
Unmarked values that differ from sku's defaults are logged as info — naming the key, both values, and the re-alignment paths — and never fail the run.

- Over warnings on every command (the minor design's drift warnings): the `validatePnpmConfig` banner proved users learn to ignore banners.
  A lint failure is unignorable because it gates CI.
- Over failing on user-managed drift: sku advises on values it doesn't own but never blocks on them.
  The ownership boundary stays honest — enforcement applies exactly to the marked set.
- Pending adoption fails lint (rather than passing silently) so that adoption actually happens: otherwise marker-less files pass forever, and future default changes would only ever info — the org policy would never land on those projects.

### Decision: `yaml` (eemeli) for file manipulation

Comment-preserving Document API, already a runtime dependency of `@sku-lib/create`.
Added as a runtime dependency of `sku`.

- Over a config-management library: the merge policies are opinionated enough that generic merge libraries buy nothing.
- Over `@pnpm/config` for writing: it is a reader/typings package.

### Decision: Defaults live in `@sku-private/utils`

The defaults module (values, setting groups, marker handling) moves from `pnpm-plugin-sku` into `@sku-private/utils`.
It is bundled into both `sku` and `@sku-lib/create` at build time: a single source of truth for create-time file generation, the lint check, and the format write.

- Create does not keep its own `pnpm-workspace.yaml` writer.
  It calls the same sync function `sku format` uses — with file creation enabled, since scaffolding is an explicit opt-in — so identical output is guaranteed by construction rather than by keeping two writers in agreement.
- Create still writes the file before dependency installation, for two reasons: sku's settings should apply to the very first install, and the file marks the new project as its own workspace root so pnpm does not resolve it against a parent workspace.
- The sync function therefore takes two call-site options: whether file creation is permitted (create only), and whether to check or write (lint vs format).

### Decision: Never create `pnpm-workspace.yaml` in existing projects

The sync only runs when `pnpm-workspace.yaml` already exists.

- Config dependencies can only be declared in `pnpm-workspace.yaml`, so a project without the file never had `pnpm-plugin-sku`.
  Creating the file would impose sku's pnpm policy on projects that never opted into it.
- Creating the file also newly marks the directory as a workspace root, changing how pnpm resolves the project.
- This makes "no file" the de-facto full opt-out: the lint check passes silently and format writes nothing.
- Create still writes the file for new projects: scaffolding is an explicit opt-in, and the file is wanted before the first install.

### Decision: Plugin migration is part of the sync

When the sync finds `pnpm-plugin-sku` in `configDependencies`, `sku format` removes the entry (and the `configDependencies` key if emptied) and logs the migration; its presence fails `sku lint`.
This is sku's own entry, not user data.
Leaving it would mean the plugin keeps runtime-merging underneath the static file, and Renovate keeps breaking.

Removing the plugin alongside the static writes preserves the effective pnpm config:

- Single-value settings: the plugin merged write-if-absent, so file values already won; missing keys get the same defaults the plugin was injecting.
- Arrays: the plugin appended its current entries at runtime; the static union is the same set, deduped.
- Object settings (currently only `allowBuilds`): the one real difference.
  The plugin won per key at runtime; after removal, a conflicting user value in the file wins instead.
  This only affects projects that deliberately overrode a sku-owned key, and it flips behaviour toward the user's stated intent.
  Documented in the changeset.
- Nothing in the wild carries `[sku_managed]` markers yet (the minor never shipped), so the migration cannot forcefully rewrite any existing value: every pre-existing value is unmarked, and unmarked values are adopted when they match defaults and preserved (as user-managed drift, info-logged by lint) when they don't.
  Forceful rewrites only ever apply to values sku itself wrote.

### Decision: No pnpm version gate

Verified by spike: pnpm 9.15.9, 10.0.0, and 10.13.0 silently ignore unknown keys in `pnpm-workspace.yaml`.
Re-tested for this change: pnpm 11.24.0 and 12.2.1 print a warning naming the unrecognized settings, then ignore them.
Installs succeed in every tested version.
Settings take effect when the project's pnpm understands them; older and newer pnpm are unaffected.
`isAtLeastPnpmV10` and `isAtLeastRecommendedPnpmVersion` are removed along with the validation banner.
If a future pnpm turns unknown settings into an error, or removes a setting sku manages, the defaults module may need per-version value sets.
Out of scope for this change.

### Decision: Entry-point gating

The sync is removed from `configureApp`, so no configuration-enabled command, postinstall, or `sku configure` runs it.
`skuSkipConfigure` and `skuSkipPostInstall` gated that path and no longer apply to the sync; no new skip flag replaces them.

- Per-value marker deletion is the documented opt-out, and deleting the whole file is the de-facto full opt-out (the sync never creates it).
- The `rootDir` and pnpm-project gates move from `configureApp` into the lint check and format step themselves.
- `sku lint` and `sku format` still run `configureProject` for their other needs (eslint config, tsconfig, ignore files); only the pnpm-workspace sync leaves `configureApp`.

### Decision: Logging

Every mutation is logged as it happens on `sku format` (for example `added minimumReleaseAge: 4320 to pnpm-workspace.yaml`, `adopted eslint in publicHoistPattern`, `updated minimumReleaseAge: 1440 → 4320`, `removed duplicate eslint from publicHoistPattern`, and `removed pnpm-plugin-sku from configDependencies`).
No output when the file is already aligned.
The lint check produces no output on success.

## Risks / Trade-offs

- Release-day red wave: the first `sku lint` after upgrading fails for every project whose file is missing managed keys, markers, or plugin cleanup → Accepted.
  It's a major; the failure message names the one-command fix (`sku format`), and the resulting diff is git-reviewable.
  The same mechanism propagates every future default change, which is the point.
- Silent pins are impossible while a value matches the default → Accepted (see the ownership decision).
  Consumers are expected to track sku's values; pinning becomes available the moment sku diverges.
- Projects without `sku lint` in CI drift silently → Accepted.
  `sku format` still fixes whenever it runs, and the next lint run (local or CI) surfaces the drift.
- Object-setting conflict flip after plugin removal (`allowBuilds` today) → Affects only projects that deliberately overrode a sku-owned key, and flips behaviour toward the user's stated intent.
  Documented in the changeset.
- Sync writes to a committed file on `sku format` → Write only when changed and log every change, so the diff is never a surprise.
  This matches the command's existing contract: format's job is to rewrite files.
- Adoption marks a user's hand-added entry that duplicates a sku default → Removal only ever applies to marked entries; deleting the marker (once the value no longer matches a default) or re-adding the entry preserves it.
  Documented in the changeset.
- Renovate or other tools may reformat the file, fighting sku's writer → Use `yaml`'s default formatting and keep edits minimal and idempotent.
  If the parsed content is aligned, don't write.
- Removing `configDependencies` leaves lockfile residue until the next install → pnpm prompts users to install after workspace file changes, so no extra messaging is needed.

## Migration Plan

1. Release sku with the sync as a major (breaking).
   The changeset notes: the lint/format-only entry points; unconditional enforcement of managed values; uniform marker ownership (including single-value settings); lint failure semantics and info advisories; the `configDependencies` migration; marker deletion as the only opt-out (and delete-the-value re-alignment); and that `skuSkipConfigure`/`skuSkipPostInstall` no longer gate the sync.
2. On upgrade, the first `sku lint` fails for plugin-era projects.
   Running `sku format` produces the one-time, git-reviewable diff: missing settings added with markers, matching unmarked values adopted, the `configDependencies` entry removed.
   Differing unmarked values are preserved as user-managed and info-logged by lint until the user re-aligns them (edit to match, or delete and let format re-add).
3. Create stops installing `pnpm-plugin-sku`; new projects get the static file only, fully marked, and pass `sku lint` immediately.
4. `pnpm-plugin-sku` remains published and in the monorepo; no npm action.

Rollback: projects can restore the `configDependencies` entry and pin the previous sku version.
The static keys are harmless alongside the plugin (the plugin's single-value merge is `??=`, so the file wins).

## Open Questions

None.
The lint/format entry points, uniform marker ownership (including single-value settings), lint failure semantics (missing keys, pending adoptions, retired entries, and plugin presence all fail), info-only user-managed drift with the delete-and-re-add re-alignment path, marker deletion as the only opt-out, the accepted silent-pin trap, and the quiet postinstall are all decided above.
