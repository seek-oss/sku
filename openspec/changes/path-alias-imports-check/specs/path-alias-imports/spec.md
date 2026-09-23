## ADDED Requirements

### Requirement: Lint checks path alias imports

`sku lint` SHALL fail when `package.json#imports` differs from what syncing the `pathAliases` sku config option would write, and SHALL NOT modify `package.json`. The failure output SHALL name the drift and suggest running `sku format`.

#### Scenario: Imports in sync

- **GIVEN** `package.json#imports` matches what syncing `pathAliases` would write
- **WHEN** `sku lint` runs
- **THEN** the path alias imports check passes
- **AND** `package.json` is unchanged

#### Scenario: Imports out of sync

- **GIVEN** `pathAliases` contains `#utils/*` but `package.json#imports` does not
- **WHEN** `sku lint` runs
- **THEN** the command exits with code 1
- **AND** the output reports the path alias imports failure
- **AND** the output suggests running `sku format`
- **AND** `package.json` is unchanged

#### Scenario: Stale imports entry

- **GIVEN** `package.json#imports` contains an entry that is not in `pathAliases`
- **WHEN** `sku lint` runs
- **THEN** the command exits with code 1

#### Scenario: No package.json

- **GIVEN** there is no `package.json` in the working directory
- **WHEN** `sku lint` runs
- **THEN** the path alias imports check passes silently

### Requirement: Format syncs path alias imports

`sku format` SHALL rewrite `package.json#imports` to match the `pathAliases` sku config option, removing the field when no aliases are configured, before running the ESLint and Prettier fixes.

#### Scenario: Imports out of sync

- **GIVEN** `package.json#imports` differs from `pathAliases`
- **WHEN** `sku format` runs
- **THEN** `package.json#imports` is rewritten to match `pathAliases`
- **AND** a subsequent `sku lint` passes the path alias imports check

#### Scenario: No aliases configured

- **GIVEN** `pathAliases` is empty and `package.json` has an `imports` field
- **WHEN** `sku format` runs
- **THEN** the `imports` field is removed from `package.json`

### Requirement: Commands that resolve subpath imports gate on drift

`sku start`, `sku start-ssr`, `sku build`, `sku build-ssr`, and `sku test` SHALL fail before starting their work when `package.json#imports` differs from what syncing `pathAliases` would write. The error SHALL name the drift and direct the user to `sku format`.

#### Scenario: Out of sync blocks the command

- **GIVEN** `package.json#imports` is out of sync with `pathAliases`
- **WHEN** `sku test` runs
- **THEN** the command exits non-zero before running any tests
- **AND** the error message directs the user to run `sku format`

#### Scenario: In sync proceeds

- **GIVEN** `package.json#imports` is in sync with `pathAliases`
- **WHEN** `sku build` runs
- **THEN** the build proceeds normally

### Requirement: Commands that do not resolve subpath imports are not gated

`sku serve`, `sku configure`, and `sku translations` subcommands SHALL NOT check or modify `package.json#imports`.

#### Scenario: Configure leaves imports untouched

- **GIVEN** `package.json#imports` is out of sync with `pathAliases`
- **WHEN** `sku configure` runs
- **THEN** `package.json` is unchanged
- **AND** the command exits with code 0

### Requirement: Skip-configure does not disable imports sync

The lint check, format fix, and command gating SHALL run regardless of `skuSkipConfigure` in `package.json`.

#### Scenario: Lint still checks with skuSkipConfigure

- **GIVEN** `package.json` sets `skuSkipConfigure` to true
- **AND** `package.json#imports` is out of sync with `pathAliases`
- **WHEN** `sku lint` runs
- **THEN** the command exits with code 1
