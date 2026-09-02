## ADDED Requirements

### Requirement: Sync runs on all sku entry points

Sku SHALL sync its recommended pnpm settings into the project's `pnpm-workspace.yaml` whenever `configureApp` runs: on every sku command, on postinstall, and on `sku configure`.
The sync MUST only run for pnpm projects with a resolved project root.
If a pnpm project has no `pnpm-workspace.yaml`, the sync MUST create it.

The sync inherits the existing configure skip conditions.
It MUST NOT run on regular sku commands when `skuSkipConfigure` is set in package.json.
It MUST NOT run on postinstall when `skuSkipPostInstall` is set.
A manual `sku configure` invocation MUST always run the sync.

#### Scenario: Sync on a regular command

- **WHEN** a user runs any sku command (e.g. `sku start`) in a pnpm project
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

#### Scenario: Missing file is created

- **WHEN** a pnpm project has no `pnpm-workspace.yaml`
- **THEN** the sync creates it containing sku's recommended settings

### Requirement: Managed values are always overwritten

Scalar and enum settings classified as managed (`blockExoticSubdeps`, `minimumReleaseAge`, `strictDepBuilds`, `trustPolicy`) SHALL be overwritten with sku's current defaults on every sync.
This applies regardless of the existing value and in both directions.
There is no never-downgrade or strength-ordering special case: managed means enforced.

#### Scenario: Outdated managed value is corrected

- **WHEN** a project's `pnpm-workspace.yaml` has `minimumReleaseAge: 1440` and sku's current default is `4320`
- **THEN** the sync rewrites the value to `4320` and logs the change

#### Scenario: Stronger user value is still overwritten

- **WHEN** a project sets `trustPolicy: 'no-downgrade'` and sku's default is `'off'`
- **THEN** the sync rewrites the value to `'off'` and logs the change

### Requirement: Collection entries are reconciled by ownership

For `allowBuilds` and the array settings (`minimumReleaseAgeExclude`, `publicHoistPattern`, `trustPolicyExclude`), entries owned by sku SHALL be reconciled.
Sku-owned entries are added when new, aligned with current defaults, and removed when sku retires them.
User-added entries MUST always be preserved.
Array results MUST be deduped.

Ownership is tracked with a trailing `# managed by sku` comment marker on each sku-owned entry.
Unmarked entries MUST be treated as user-owned.
The one exception: unmarked entries exactly matching sku's current defaults SHALL be adopted (marked) on every sync.
If the sync removes a retired entry a user wants to keep, the user can add it back.
Because it no longer matches a default, subsequent syncs MUST leave it user-owned and untouched.

#### Scenario: New default entry propagates

- **WHEN** sku adds `'@vocab/*'` to its default `minimumReleaseAgeExclude` and a project's file lacks it
- **THEN** the sync appends `'@vocab/*'` with a `# managed by sku` marker, preserving all existing entries, and logs the addition

#### Scenario: Retired sku entry is removed

- **WHEN** sku removes an entry from its defaults and a project's file contains that entry with a `# managed by sku` marker
- **THEN** the sync removes the entry and logs the removal

#### Scenario: User entries are never removed

- **WHEN** a project's `publicHoistPattern` or `allowBuilds` contains an unmarked user-added entry
- **THEN** every sync leaves that entry in place

#### Scenario: Unmarked entry matching a default is adopted

- **WHEN** a project's `minimumReleaseAgeExclude` contains an unmarked entry that exactly matches one of sku's current defaults
- **THEN** the sync marks it `# managed by sku` so it is reconciled as sku-owned from then on

#### Scenario: Deleted marker on a current default is re-adopted

- **WHEN** a user deletes the `# managed by sku` marker from an entry that still matches a current sku default
- **THEN** the next sync re-marks it as `# managed by sku`

#### Scenario: Re-added retired entry is preserved

- **WHEN** the sync removes a retired sku-owned entry
- **AND** the user re-adds the same entry without a marker
- **THEN** subsequent syncs treat it as user-owned and leave it in place

### Requirement: Managed keys are annotated

Values written by the sync SHALL carry a trailing `# managed by sku` comment marker.
This applies to managed scalars and to each sku-owned entry within merged collections, so user-added entries stay visually distinct.
Markers MUST NOT replace existing user comments.
An entry carrying a user comment is never marked, so it is never adopted.
A file whose values and markers already match sku's defaults MUST NOT be rewritten.

#### Scenario: Managed scalar is marked

- **WHEN** the sync adds or overwrites a managed scalar such as `minimumReleaseAge`
- **THEN** the written line carries a trailing `# managed by sku` marker (combined with any explanatory comment)

#### Scenario: User comment on an entry is preserved

- **WHEN** a sku-owned entry already has a user comment
- **THEN** the sync leaves the user's comment in place instead of adding its marker

### Requirement: Existing file content is preserved

The sync MUST preserve existing comments, the `packages` field, and any keys sku does not manage.
The sync MUST NOT rewrite the file when its content is already aligned with sku's defaults.

#### Scenario: Comments survive sync

- **WHEN** a project's `pnpm-workspace.yaml` contains comments on managed or unmanaged keys
- **THEN** those comments are intact after the sync

#### Scenario: Aligned file is untouched

- **WHEN** the file already matches sku's defaults
- **THEN** the sync performs no write and produces no output

### Requirement: Changes are logged

The sync SHALL log each mutation it makes.
This covers additions, overwrites with old and new values, removals of retired sku-owned entries, and removal of the `pnpm-plugin-sku` config dependency.
The sync MUST NOT produce output when no changes are made.

#### Scenario: Overwrite is announced

- **WHEN** the sync rewrites `minimumReleaseAge` from `1440` to `4320`
- **THEN** the log output names the key and both the old and new values

### Requirement: pnpm-plugin-sku config dependency is migrated away

When the sync finds `pnpm-plugin-sku` in `configDependencies`, it SHALL remove the entry and log the migration.
If `configDependencies` becomes empty, the key itself MUST be removed.
Projects MUST NOT require `pnpm add --config pnpm-plugin-sku` at any point.
The `pnpm-plugin-sku` package itself remains in the sku monorepo and published.

#### Scenario: Existing plugin project migrates

- **WHEN** a project's `pnpm-workspace.yaml` contains `configDependencies: [pnpm-plugin-sku]`
- **THEN** the first sync after upgrading sku removes the entry, writes any missing static settings, and logs the migration
