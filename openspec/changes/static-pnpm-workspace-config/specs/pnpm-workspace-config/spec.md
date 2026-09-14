## ADDED Requirements

### Requirement: Sync runs on lint and format only

Sku SHALL sync its recommended pnpm settings into the project's `pnpm-workspace.yaml` through exactly two entry points. A read-only check on `sku lint`. An enforcing write on `sku format`.

The sync MUST NOT run on any other sku command, on postinstall, or on `sku configure`.

The sync MUST NOT be gated by `skuSkipConfigure` or `skuSkipPostInstall`. Those flags do not apply to the lint check or the format write.

The sync MUST only run for pnpm projects with a resolved project root and an existing `pnpm-workspace.yaml`.

The sync MUST NOT create `pnpm-workspace.yaml` when it is missing.

#### Scenario: Lint checks without writing

- **WHEN** a user runs `sku lint` in a pnpm project with an existing `pnpm-workspace.yaml`
- **THEN** the file is checked against sku's recommended settings and is never changed

#### Scenario: Format enforces

- **WHEN** a user runs `sku format` in a pnpm project with an existing `pnpm-workspace.yaml`
- **THEN** the file's sku-managed values are aligned with sku's recommended settings before the command completes

#### Scenario: Other commands do not sync

- **WHEN** a user runs a configuration-enabled sku command other than lint or format (for example `sku start`, `sku build`, or `sku test`)
- **THEN** `pnpm-workspace.yaml` is neither checked nor changed

#### Scenario: Configure does not sync

- **WHEN** a user runs `sku configure`
- **THEN** `pnpm-workspace.yaml` is neither checked nor changed

#### Scenario: Postinstall does not sync

- **WHEN** sku's postinstall runs
- **THEN** `pnpm-workspace.yaml` is neither checked nor changed

#### Scenario: Skipped for non-pnpm projects

- **WHEN** a user runs `sku lint` or `sku format` in a yarn or npm project
- **THEN** no `pnpm-workspace.yaml` is created, checked, or changed
- **AND** the lint check passes

#### Scenario: Missing file is left untouched

- **WHEN** a pnpm project has no `pnpm-workspace.yaml`
- **AND** a user runs `sku lint` or `sku format`
- **THEN** no file is created
- **AND** no settings are written
- **AND** the lint check passes

### Requirement: Values are managed by uniform marker ownership

Every value in the synced settings is either sku-managed or user-managed. A `[sku_managed]` marker in the value's comment tracks ownership.

A value counts as sku-managed when its comment contains the marker anywhere. Sku writes the marker at the end of the comment, after any explanatory text (for example `# 3 days [sku_managed]`).

This rule applies uniformly to single-value settings, keys within object settings, and array entries. No setting kind has a fixed owner. No marker is informational only.

Unmarked values MUST be treated as user-managed and MUST always be preserved.

Removing a value's marker SHALL make it user-managed. This is the only per-value opt-out.

The one exception: unmarked values exactly matching sku's current defaults SHALL be adopted (marked) by `sku format`.

#### Scenario: Marked single-value setting is sku-managed

- **WHEN** a project's `minimumReleaseAge` carries a `[sku_managed]` marker
- **THEN** sku may add, rewrite, or remove it on `sku format` like any other managed value

#### Scenario: Unmarked single-value setting is user-managed

- **WHEN** a user removes the `[sku_managed]` marker from `minimumReleaseAge` and sets a non-default value
- **THEN** `sku format` leaves the value unchanged
- **AND** `sku lint` treats it as user-managed drift

#### Scenario: Unmarked collection entries are user-managed

- **WHEN** a project's `publicHoistPattern` or `allowBuilds` contains an unmarked user-added entry
- **THEN** every sync leaves that entry in place

#### Scenario: Removed marker on a current default is re-adopted

- **WHEN** a user removes the `[sku_managed]` marker from a value that still matches a current sku default
- **AND** the user runs `sku format`
- **THEN** the value is re-marked as `[sku_managed]`

#### Scenario: Unmarked retired entry is never touched

- **WHEN** sku retires an entry and a project's file contains that entry without a marker
- **THEN** subsequent syncs never remove or re-adopt it, because it no longer matches a default

### Requirement: Lint fails on managed drift

`sku lint` SHALL fail when the file requires managed changes. A managed setting or entry is missing. A marked value differs from sku's current default. Sku retired a marked entry. An unmarked value exactly matches a sku default but has not been adopted. Or `pnpm-plugin-sku` is still present in `configDependencies`.

Failures SHALL name the key and the current and recommended states. The lint output SHALL direct the user to run `sku format`, once at the end of the run rather than in every failure message.

The lint check MUST NOT change the file.

A file whose values and markers already match sku's defaults SHALL pass silently.

#### Scenario: Missing managed setting fails

- **WHEN** a project's `pnpm-workspace.yaml` lacks `minimumReleaseAge`
- **AND** the user runs `sku lint`
- **THEN** the lint run fails, naming the missing setting and directing the user to `sku format`

#### Scenario: Differing marked value fails

- **WHEN** a project's `pnpm-workspace.yaml` has `minimumReleaseAge: 1440` with a `[sku_managed]` marker and sku's current default is `4320`
- **AND** the user runs `sku lint`
- **THEN** the lint run fails, naming the key, both values, and `sku format`

#### Scenario: Retired marked entry fails

- **WHEN** a project's file contains a `[sku_managed]` entry that is no longer in sku's defaults
- **AND** the user runs `sku lint`
- **THEN** the lint run fails, naming the entry and directing the user to `sku format` to remove it

#### Scenario: Pending adoption fails

- **WHEN** a project's file contains an unmarked value that exactly matches a current sku default
- **AND** the user runs `sku lint`
- **THEN** the lint run fails, directing the user to `sku format` to adopt the value

#### Scenario: Plugin presence fails

- **WHEN** a project's `pnpm-workspace.yaml` contains `pnpm-plugin-sku` in `configDependencies`
- **AND** the user runs `sku lint`
- **THEN** the lint run fails, directing the user to `sku format` to remove it

#### Scenario: Aligned file passes silently

- **WHEN** all managed values and entries align with sku's defaults and no adoptions are pending
- **THEN** the lint check passes and produces no output

### Requirement: Lint logs user-managed drift as info

When `sku lint` finds an unmarked (user-managed) value that differs from sku's current default, it SHALL log an info message. The message names the key, the current value, the recommended value, and the two re-alignment paths. Edit the value to match sku's default. Or remove it and let the next `sku format` add it again as sku-managed.

User-managed drift MUST NOT fail the lint run.

No info SHALL be logged for user-managed entries that have no corresponding sku default.

#### Scenario: Differing user-managed value is info-only

- **WHEN** a project's `pnpm-workspace.yaml` has `minimumReleaseAge: 1440` without a marker and sku's current default is `4320`
- **AND** the user runs `sku lint`
- **THEN** an info message names the key, both values, and the re-alignment paths
- **AND** the lint run does not fail on it

#### Scenario: User's own entries are silent

- **WHEN** a project's file contains unmarked entries with no corresponding sku default
- **AND** the user runs `sku lint`
- **THEN** nothing is logged about them

### Requirement: Format enforces managed values

`sku format` SHALL enforce sku's current defaults for all sku-managed values. It adds missing managed single-value settings, object keys, and array entries with the `[sku_managed]` marker. It rewrites marked values that differ from defaults, in both directions. It removes marked entries that sku retired.

There is no never-downgrade or strength-ordering special case. Managed means enforced.

User-managed values MUST always be preserved.

Unmarked values exactly matching sku's current defaults SHALL be adopted (marked). Their existing comments SHALL be replaced by the marker and any sku explanatory comment.

Array results MUST be deduped. When duplicate values have different ownership, the unmarked user-owned entry MUST be retained.

#### Scenario: Missing managed value is added

- **WHEN** a project's `pnpm-workspace.yaml` lacks `minimumReleaseAge`
- **AND** the user runs `sku format`
- **THEN** the sync adds it with sku's current default and a `[sku_managed]` marker, and logs the addition

#### Scenario: Format rewrites an outdated managed value

- **WHEN** a project's `pnpm-workspace.yaml` has `minimumReleaseAge: 1440` with a `[sku_managed]` marker and sku's current default is `4320`
- **AND** the user runs `sku format`
- **THEN** the sync rewrites the value to `4320` and logs the change

#### Scenario: Marked value is rewritten in both directions

- **WHEN** a project sets `trustPolicy: 'no-downgrade'` with a `[sku_managed]` marker and sku's default is `'off'`
- **AND** the user runs `sku format`
- **THEN** the sync rewrites the value to `'off'` and logs the change

#### Scenario: Retired marked entry is removed

- **WHEN** sku removes an entry from its defaults and a project's file contains that entry with a `[sku_managed]` marker
- **AND** the user runs `sku format`
- **THEN** the sync removes the entry and logs the removal

#### Scenario: Differing user-managed value is preserved

- **WHEN** a project's `pnpm-workspace.yaml` has `minimumReleaseAge: 1440` without a marker and sku's current default is `4320`
- **AND** the user runs `sku format`
- **THEN** the value is left at `1440`

#### Scenario: User re-aligns by removing a value

- **WHEN** a project has a user-managed value that differs from sku's default
- **AND** the user removes the value and runs `sku format`
- **THEN** the sync adds the setting again with sku's current default and a `[sku_managed]` marker

#### Scenario: Unmarked entry matching a default is adopted

- **WHEN** a project's `minimumReleaseAgeExclude` contains an unmarked entry that exactly matches one of sku's current defaults
- **AND** the user runs `sku format`
- **THEN** the sync marks it `[sku_managed]`, replacing any existing comment

#### Scenario: Duplicates are deduped, user-owned copy retained

- **WHEN** a project's array setting contains the same value both marked and unmarked
- **AND** the user runs `sku format`
- **THEN** the duplicate is removed and the unmarked user-owned entry is retained

### Requirement: Managed values are annotated

Values written by the sync SHALL carry a comment ending in the `[sku_managed]` marker.

This applies to managed single-value settings and to each sku-managed entry within merged collections. User-managed entries then stay visually distinct.

When the sync adopts or overwrites a managed value, it MUST replace existing inline or preceding comments. The replacement is the sku marker and any sku explanatory comment.

Comments on user-managed entries and unmanaged keys MUST be preserved.

A file whose values and markers already match sku's defaults MUST NOT be rewritten.

#### Scenario: Managed value is marked

- **WHEN** the sync adds or overwrites a managed value such as `minimumReleaseAge`
- **THEN** the written line carries a comment ending in the `[sku_managed]` marker, preceded by any explanatory comment (`# 3 days [sku_managed]`)

#### Scenario: Comment on an adopted entry is replaced

- **WHEN** an unmarked entry matching a sku default already has a user comment
- **AND** the user runs `sku format`
- **THEN** the sync replaces the user's comment with the `[sku_managed]` marker

### Requirement: Existing file content is preserved

The sync MUST preserve comments on user-managed entries, the `packages` field, and any keys sku does not manage.

The sync MUST NOT rewrite the file when its content is already aligned with sku's defaults.

#### Scenario: Comments survive sync

- **WHEN** a project's `pnpm-workspace.yaml` contains comments on unmanaged keys
- **AND** the user runs `sku format`
- **THEN** those comments are intact after the sync

#### Scenario: Aligned file is untouched

- **WHEN** the file already matches sku's defaults
- **AND** the user runs `sku format`
- **THEN** the sync performs no write and produces no output

### Requirement: Changes are logged

The format sync SHALL log each mutation it makes.

This covers additions, adoptions, duplicate removal, overwrites with old and new values, removals of retired sku-managed entries, and removal of the `pnpm-plugin-sku` config dependency.

The sync MUST NOT produce output when no changes are made.

#### Scenario: Addition is announced

- **WHEN** the sync adds `minimumReleaseAge: 4320` to a project's file
- **THEN** the log output names the key and the value added

#### Scenario: Overwrite is announced

- **WHEN** the sync rewrites `minimumReleaseAge` from `1440` to `4320`
- **THEN** the log output names the key and both the old and new values

### Requirement: pnpm-plugin-sku config dependency is migrated away

When `sku format` finds `pnpm-plugin-sku` in `configDependencies`, it SHALL remove the entry and log the migration.

If the entry is repeated, all occurrences SHALL be removed.

If `configDependencies` becomes empty, the key itself MUST be removed.

An already-empty `configDependencies` key without `pnpm-plugin-sku` MUST be preserved.

The presence of `pnpm-plugin-sku` in `configDependencies` SHALL fail `sku lint`.

Projects MUST NOT require `pnpm add --config pnpm-plugin-sku` at any point.

The `pnpm-plugin-sku` package itself remains in the sku monorepo and published.

#### Scenario: Existing plugin project migrates

- **WHEN** a project's `pnpm-workspace.yaml` contains `configDependencies` with `pnpm-plugin-sku`
- **AND** the user runs `sku format` after upgrading sku
- **THEN** the sync removes the entry
- **AND** it adds any missing managed settings
- **AND** it adopts matching unmarked values
- **AND** it preserves differing unmarked values as user-managed
- **AND** it logs the migration
