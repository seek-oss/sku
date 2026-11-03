## ADDED Requirements

### Requirement: Build warns about duplicate packages

`sku build` SHALL print one warning for each checked package that has more than one copy in the client bundle. The warning names the package, lists the version and directory of each copy, and suggests the package manager's `why` command.

#### Scenario: Two versions of a checked package

- **GIVEN** the client bundle contains `@vanilla-extract/css` 1.20.0 and 1.21.2
- **WHEN** `sku build` runs
- **THEN** the output contains one warning for `@vanilla-extract/css`
- **AND** the warning lists both versions and their directories

#### Scenario: Same version in two directories

- **GIVEN** the client bundle contains `braid-design-system` 34.6.1 from two directories with different peer dependencies
- **WHEN** `sku build` runs
- **THEN** the output contains a warning for `braid-design-system`

#### Scenario: SSR build

- **GIVEN** an SSR app whose client bundle contains two copies of `react`
- **WHEN** `sku build` runs
- **THEN** the output contains exactly one warning for `react`

#### Scenario: Warnings do not fail the build

- **GIVEN** the client bundle contains two copies of `react`
- **WHEN** `sku build` runs
- **THEN** the command exits with code 0

#### Scenario: No duplicates

- **GIVEN** the client bundle contains one copy of each checked package
- **WHEN** `sku build` runs
- **THEN** the output contains no duplicate package warning

### Requirement: Build ignores copies outside the client bundle

`sku build` SHALL NOT warn about a copy that the client bundle does not contain.

#### Scenario: Second copy used by another workspace package

- **GIVEN** another package in the monorepo depends on a different version of `react`
- **AND** the app does not import that package
- **WHEN** `sku build` runs
- **THEN** the output contains no warning for `react`

### Requirement: Start warns about duplicate packages

`sku start` SHALL print the same warning, without stopping the dev server, when the app's dependency tree resolves more than one copy of a checked package.

#### Scenario: Duplicate found at startup

- **GIVEN** the app's dependencies resolve two copies of `@vanilla-extract/css`
- **WHEN** `sku start` runs
- **THEN** the output contains a warning for `@vanilla-extract/css`
- **AND** the dev server keeps serving requests

### Requirement: Checked packages

The check SHALL cover `react`, `react-dom`, `@vanilla-extract/css`, and every compile package, and no other packages.

#### Scenario: Compile package

- **GIVEN** a package sets `"skuCompilePackage": true`
- **AND** the client bundle contains two copies of it
- **WHEN** `sku build` runs
- **THEN** the output contains a warning for that package

#### Scenario: Other @seek package

- **GIVEN** a `@seek/*` package without `"skuCompilePackage": true`
- **AND** the client bundle contains two copies of it
- **WHEN** `sku build` runs
- **THEN** the output contains no warning for that package
