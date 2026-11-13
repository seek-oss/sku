## ADDED Requirements

### Requirement: Lint warns about duplicate versions of checked packages

When more than one version of a checked package is reachable from the app's `dependencies` or `devDependencies`, `sku lint` SHALL print a warning. The checked packages are `react`, `react-dom`, `braid-design-system`, `@vanilla-extract/css`, and the app's compile packages. The warning names the package, each version, and the dependency chain to each copy.

#### Scenario: Two versions with pnpm

- **WHEN** an app uses pnpm and two versions of `react` are reachable from its dependencies
- **THEN** lint prints a warning with both versions and their dependency chains

#### Scenario: Two versions with npm or yarn

- **WHEN** an app uses npm or yarn and two versions of `@vanilla-extract/css` are in nested `node_modules` folders
- **THEN** lint prints a warning with both versions and their dependency chains

#### Scenario: Different version in devDependencies

- **WHEN** the app has `@vanilla-extract/css` in `devDependencies` and one of its dependencies resolves a different version
- **THEN** lint prints a warning with both versions

#### Scenario: Two versions of a compile package

- **WHEN** two versions of an `@seek` package flagged `skuCompilePackage`, or of a package in the app's `compilePackages` config, are reachable from its dependencies
- **THEN** lint prints a warning with both versions and their dependency chains

#### Scenario: Same version in more than one folder

- **WHEN** a checked package is in more than one folder, and each copy has the same version
- **THEN** lint prints no warning for that package

#### Scenario: Package that is not checked

- **WHEN** two versions of an `@seek` package are reachable, and that package is not one of the app's compile packages
- **THEN** lint prints no warning for that package

### Requirement: Lint warns when react-dom loads a different react version

When a copy of `react-dom` resolves a copy of `react` at a different version, `sku lint` SHALL print a warning with both versions. Lint compares each `react-dom` copy with the `react` copy that it resolves.

#### Scenario: Different versions

- **WHEN** the app's `react-dom` resolves a `react` copy at a different version
- **THEN** lint prints a warning with both versions

#### Scenario: Same version

- **WHEN** the app's `react-dom` resolves a `react` copy at the same version, and a second `react` copy is elsewhere in the dependencies
- **THEN** lint prints no `react-dom` warning

### Requirement: Lint warns when a peer dependency resolves outside its range

When a checked package has a peer dependency on another checked package, and the resolved copy is outside the declared range, `sku lint` SHALL print a warning. The warning names the package, the expected range, and the resolved version. Lint checks each copy separately. The `react-dom` peer dependency on `react` follows the requirement above.

#### Scenario: Resolved version outside the range

- **WHEN** a compile package has a peer dependency on `braid-design-system` at `^31.0.0` and resolves `braid-design-system` at `32.0.0`
- **THEN** lint prints a warning with the expected range and the resolved version

#### Scenario: Resolved version inside the range

- **WHEN** a checked package resolves a peer copy inside its declared range, and other copies of the peer are elsewhere in the dependencies
- **THEN** lint prints no peer warning for that package

#### Scenario: Range that is not semver

- **WHEN** a checked package has a peer dependency with the range `workspace:*`
- **THEN** lint prints no peer warning for that dependency

#### Scenario: Prerelease inside the range

- **WHEN** a checked package has a peer dependency on `react` at `^19.0.0` and resolves `react` at `19.1.0-canary-abc`
- **THEN** lint prints no peer warning for that dependency

### Requirement: The check runs only on full lint runs and never fails lint

The check SHALL run only when `sku lint` has no path arguments and the app's `package.json` does not set `skuSkipValidatePeerDeps`. The check never changes the lint exit code.

#### Scenario: Warning printed

- **WHEN** the check prints a warning
- **THEN** the lint exit code does not change

#### Scenario: Lint with path arguments

- **WHEN** `sku lint` runs with path arguments in an app with duplicate versions
- **THEN** lint prints no duplicate-package warning

#### Scenario: Check turned off

- **WHEN** the app's `package.json` sets `skuSkipValidatePeerDeps`
- **THEN** lint prints no duplicate-package warning

#### Scenario: Dependencies not installed

- **WHEN** lint runs in an app whose dependencies are not installed
- **THEN** lint prints no duplicate-package warning and continues with its other checks

## REMOVED Requirements

### Requirement: Start and build duplicate package warnings

**Reason**: The lint check replaces these warnings. The old check did not run with pnpm, and developers often missed its warnings during start and build.

**Migration**: Run `sku lint` to see duplicate-package warnings. To turn them off, set `skuSkipValidatePeerDeps` in `package.json`.
