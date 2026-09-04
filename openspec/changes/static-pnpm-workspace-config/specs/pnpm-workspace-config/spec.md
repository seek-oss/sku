## ADDED Requirements

### Requirement: Sync runs on all sku entry points

Sku SHALL sync its recommended pnpm settings into the project's `pnpm-workspace.yaml` whenever `configureApp` runs: on configuration-enabled sku commands and on postinstall.
The sync MUST only run for pnpm projects with a resolved project root and an existing `pnpm-workspace.yaml`.
The sync MUST NOT create `pnpm-workspace.yaml` when it is missing.

The sync inherits the existing configure skip conditions.
It MUST NOT run on regular sku commands when `skuSkipConfigure` is set in package.json.
It MUST NOT run on postinstall when `skuSkipPostInstall` is set.
A manual `sku configure` invocation MUST always run the sync.

#### Scenario: Sync on a regular command

- **WHEN** a user runs a configuration-enabled sku command (e.g. `sku start`) in a pnpm project with an existing `pnpm-workspace.yaml`
- **THEN** the project's `pnpm-workspace.yaml` is aligned with sku's recommended settings before the command proceeds

#### Scenario: Skipped for non-pnpm projects

- **WHEN** a user runs a sku command in a yarn or npm project
- **THEN** no `pnpm-workspace.yaml` is created or modified

#### Scenario: Skipped via skuSkipConfigure

- **WHEN** a project sets `skuSkipConfigure: true` in package.json
- **AND** a user runs a regular sku command
- **THEN** the sync does not run and `pnpm-workspace.yaml` is not modified

#### Scenario: Manual configure always syncs

- **WHEN** a user runs `sku configure` in a pnpm project
- **THEN** the sync runs even if `skuSkipConfigure` is set

#### Scenario: Missing file is left untouched

- **WHEN** a pnpm project has no `pnpm-workspace.yaml`
- **AND** a user runs a configuration-enabled sku command, postinstall, or `sku configure`
- **THEN** no file is created and no settings are written

### Requirement: Automatic sync is additive-only

The sync that runs on regular sku commands and postinstall MUST NOT overwrite existing config values and MUST NOT remove user-owned entries.
Missing managed single-value settings SHALL be added with sku's current defaults.
A single-value setting is one whose value is a string, number, or boolean — not an array or an object.
Missing sku-owned keys in object settings SHALL be added.
Existing unmarked object keys MUST keep their values as user-owned entries.
An object setting is one whose value is a flat map of keys to single values (currently only `allowBuilds`).
Array settings SHALL be unioned: missing sku entries are appended, existing entries are preserved, and the result is deduped.
When duplicate values have different ownership, the unmarked user-owned entry MUST be retained.
Retired sku-owned entries MUST NOT be removed by the automatic sync.

#### Scenario: Missing managed value is added

- **WHEN** a project's `pnpm-workspace.yaml` lacks `minimumReleaseAge`
- **THEN** the sync adds it with sku's current default and a `# sku_managed` marker, and logs the addition

#### Scenario: Existing managed value is preserved

- **WHEN** a project's `pnpm-workspace.yaml` has `minimumReleaseAge: 1440` and sku's current default is `4320`
- **THEN** the automatic sync leaves the value at `1440`

#### Scenario: Existing allowBuilds key keeps its value

- **WHEN** a project's `allowBuilds` contains an unmarked key with a user-set value
- **THEN** the automatic sync leaves that key's value unchanged and does not adopt it

#### Scenario: Retired sku entry is retained

- **WHEN** sku removes an entry from its defaults and a project's file contains that entry with a `# sku_managed` marker
- **AND** the automatic sync runs
- **THEN** the entry is left in place, with its marker intact

### Requirement: Drift is surfaced as warnings

When the automatic sync finds an existing managed value that differs from sku's current default, or a marked entry that sku has retired, it SHALL log a warning naming the key, the current value, the recommended value, and suggesting `sku configure`.
For retired entries, the warning SHALL state that the entry is no longer a sku default and present both resolutions: run `sku configure` to remove it, or delete its `# sku_managed` marker to keep it as a user-managed entry.
The sync MUST NOT warn when values align with sku's defaults.

#### Scenario: Differing managed value warns

- **WHEN** a project's `pnpm-workspace.yaml` has `minimumReleaseAge: 1440` and sku's current default is `4320`
- **THEN** the sync logs a warning naming the key, both values, and `sku configure`

#### Scenario: Retired marked entry warns

- **WHEN** a project's file contains a `# sku_managed` entry that is no longer in sku's defaults
- **THEN** the automatic sync logs a warning that the entry is no longer a sku default, that `sku configure` will remove it, and that deleting its `# sku_managed` marker keeps it as a user-managed entry

#### Scenario: Aligned file is silent

- **WHEN** all managed values and entries align with sku's defaults
- **THEN** the sync produces no warnings

### Requirement: sku configure enforces managed values

`sku configure` is the only entry point that enforces managed values; the automatic sync on regular commands and postinstall MUST NOT overwrite or remove anything.
On `sku configure`, the single-value settings classified as managed SHALL be overwritten with sku's current defaults.
This applies regardless of the existing value and in both directions.
There is no never-downgrade or strength-ordering special case: managed means enforced.
Marked keys in object settings SHALL be aligned with sku's current defaults.
Unmarked object keys whose values differ from sku's defaults MUST remain unchanged as user-owned entries.
Retired sku-owned entries — entries that no longer match sku's current defaults but still carry a `# sku_managed` marker — SHALL be removed.
Entries whose marker has been removed MUST NOT be removed.

#### Scenario: Outdated managed value is corrected

- **WHEN** a project's `pnpm-workspace.yaml` has `minimumReleaseAge: 1440` and sku's current default is `4320`
- **AND** the user runs `sku configure`
- **THEN** the sync rewrites the value to `4320` and logs the change

#### Scenario: Stronger user value is still overwritten

- **WHEN** a project sets `trustPolicy: 'no-downgrade'` and sku's default is `'off'`
- **AND** the user runs `sku configure`
- **THEN** the sync rewrites the value to `'off'` and logs the change

#### Scenario: Retired sku entry is removed

- **WHEN** sku removes an entry from its defaults and a project's file contains that entry with a `# sku_managed` marker
- **AND** the user runs `sku configure`
- **THEN** the sync removes the entry and logs the removal

#### Scenario: Unmarked retired entry is preserved

- **WHEN** a project's file contains an entry that sku has retired
- **AND** the entry does not carry a `# sku_managed` marker
- **THEN** the sync leaves the entry in place, both on automatic runs and on `sku configure`

### Requirement: Collection entries are managed by ownership

For object and array settings, entries owned by sku SHALL be aligned with sku's defaults.
Sku-owned entries are added when new and aligned with current defaults on every sync; they are removed when sku retires them on `sku configure` only.
User-added entries MUST always be preserved.
Array results MUST be deduped.

Ownership is tracked with a trailing `# sku_managed` comment marker on each sku-owned entry.
Unmarked entries MUST be treated as user-owned.
The one exception: unmarked entries exactly matching sku's current defaults SHALL be adopted (marked) on every sync.
When an entry is adopted, its existing comments MUST be replaced with the `# sku_managed` marker and any sku explanatory comment.
If the enforcing sync removes a retired entry a user wants to keep, the user can add it back, or delete its marker before running `sku configure`.
Because a retired entry no longer matches a default, an unmarked copy is never re-adopted, so subsequent syncs MUST leave it user-owned and untouched.

#### Scenario: New default entry propagates

- **WHEN** sku adds `'@vocab/*'` to its default `minimumReleaseAgeExclude` and a project's file lacks it
- **THEN** the sync appends `'@vocab/*'` with a `# sku_managed` marker, preserving all existing entries, and logs the addition

#### Scenario: User entries are never removed

- **WHEN** a project's `publicHoistPattern` or `allowBuilds` contains an unmarked user-added entry
- **THEN** every sync leaves that entry in place, both on automatic runs and on `sku configure`

#### Scenario: Unmarked entry matching a default is adopted

- **WHEN** a project's `minimumReleaseAgeExclude` contains an unmarked entry that exactly matches one of sku's current defaults
- **THEN** the sync marks it `# sku_managed` so it is managed as sku-owned from then on, replacing any existing comment

#### Scenario: Deleted marker on a current default is re-adopted

- **WHEN** a user deletes the `# sku_managed` marker from an entry that still matches a current sku default
- **THEN** the next sync re-marks it as `# sku_managed`

#### Scenario: Re-added retired entry is preserved

- **WHEN** the enforcing sync removes a retired sku-owned entry
- **AND** the user re-adds the same entry without a marker
- **THEN** subsequent syncs treat it as user-owned and leave it in place

### Requirement: Managed keys are annotated

Values written by the sync SHALL carry a trailing `# sku_managed` comment marker.
This applies to managed single-value settings and to each sku-owned entry within merged collections, so user-added entries stay visually distinct.
When the sync adopts or overwrites a managed entry, its existing inline or preceding comments MUST be replaced with the sku marker and any sku explanatory comment.
Comments on user-owned entries and unmanaged keys MUST be preserved.
A file whose values and markers already match sku's defaults MUST NOT be rewritten.

#### Scenario: Managed value is marked

- **WHEN** the sync adds or overwrites a managed value such as `minimumReleaseAge`
- **THEN** the written line carries a trailing `# sku_managed` marker (combined with any explanatory comment)

#### Scenario: Comment on an adopted entry is replaced

- **WHEN** an unmarked entry matching a sku default already has a user comment
- **THEN** the sync replaces the user's comment with the `# sku_managed` marker

### Requirement: Existing file content is preserved

The sync MUST preserve comments on user-owned entries, the `packages` field, and any keys sku does not manage.
The sync MUST NOT rewrite the file when its content is already aligned with sku's defaults.

#### Scenario: Comments survive sync

- **WHEN** a project's `pnpm-workspace.yaml` contains comments on unmanaged keys
- **THEN** those comments are intact after the sync

#### Scenario: Aligned file is untouched

- **WHEN** the file already matches sku's defaults
- **THEN** the sync performs no write and produces no output

### Requirement: Changes are logged

The sync SHALL log each mutation it makes.
This covers file creation, additions, adoptions, duplicate removal, overwrites with old and new values (`sku configure` only), removals of retired sku-owned entries (`sku configure` only), and removal of the `pnpm-plugin-sku` config dependency.
The sync MUST NOT produce output when no changes are made.

#### Scenario: Addition is announced

- **WHEN** the sync adds `minimumReleaseAge: 4320` to a project's file
- **THEN** the log output names the key and the value added

#### Scenario: Overwrite is announced

- **WHEN** the enforcing sync rewrites `minimumReleaseAge` from `1440` to `4320`
- **THEN** the log output names the key and both the old and new values

### Requirement: pnpm-plugin-sku config dependency is migrated away

When the sync finds `pnpm-plugin-sku` in `configDependencies`, it SHALL remove the entry and log the migration.
If the entry is repeated, all occurrences SHALL be removed.
If `configDependencies` becomes empty, the key itself MUST be removed.
An already-empty `configDependencies` key without `pnpm-plugin-sku` MUST be preserved.
Projects MUST NOT require `pnpm add --config pnpm-plugin-sku` at any point.
The `pnpm-plugin-sku` package itself remains in the sku monorepo and published.

#### Scenario: Existing plugin project migrates

- **WHEN** a project's `pnpm-workspace.yaml` contains `configDependencies` with `pnpm-plugin-sku`
- **THEN** the first sync after upgrading sku removes the entry, adds any missing static settings, leaves existing values untouched, and logs the migration
