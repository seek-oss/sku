## ADDED Requirements

### Requirement: Duplicate watched package versions are reported at lint

When a full `sku lint` run resolves `react`, `react-dom`, `braid-design-system`, or `@vanilla-extract/css` at more than one distinct version in the app's dependency graph (everything reachable from its `dependencies` and `devDependencies`), sku SHALL print a warning naming the package, each resolved version, and how each copy is reached, and SHALL still exit lint successfully.

#### Scenario: Duplicate versions under pnpm

- **WHEN** an app using pnpm has two versions of `react` reachable from its dependencies and `sku lint` runs without path arguments
- **THEN** a warning identifies both versions and their dependency chains, and the lint exit code is unaffected

#### Scenario: Duplicate versions under npm or yarn

- **WHEN** an app using npm or yarn has two versions of `@vanilla-extract/css` in nested `node_modules` and `sku lint` runs without path arguments
- **THEN** the same style of warning is printed, and the lint exit code is unaffected

#### Scenario: Duplicate involving a devDependency

- **WHEN** an app declares `@vanilla-extract/css` in `devDependencies`, one of its dependencies resolves a different version of it, and `sku lint` runs without path arguments
- **THEN** a warning identifies both versions, and the lint exit code is unaffected

#### Scenario: Same version in multiple directories

- **WHEN** a watched package is present in multiple directories at the same version
- **THEN** no user-facing warning is printed for that package

### Requirement: React and react-dom version mismatch is reported at lint

When a `react-dom` copy in the app's dependency graph resolves a `react` copy at a different version, sku SHALL print a warning identifying both versions and SHALL still exit lint successfully. The check is evaluated per `react-dom` copy, against the `react` copy it resolves.

#### Scenario: Mismatched pair

- **WHEN** an app's `react-dom` resolves `react` at a different version and `sku lint` runs without path arguments
- **THEN** a warning identifies the mismatched versions, and the lint exit code is unaffected

#### Scenario: Matching pair

- **WHEN** an app's `react-dom` resolves `react` at the same version
- **THEN** no pair-mismatch warning is printed, even if another copy of `react` exists elsewhere in the graph

### Requirement: Duplicate compile package versions are reported at lint

When a full `sku lint` run resolves any of the app's compile packages — detected `@seek` packages flagged `skuCompilePackage`, sku's default compile packages, and user-configured `compilePackages` — at more than one distinct version in the app's dependency graph, sku SHALL print a warning naming the package, each resolved version, and how each copy is reached, and SHALL still exit lint successfully.

#### Scenario: Duplicate `@seek` compile package versions under pnpm

- **WHEN** an app using pnpm has two versions of an `@seek` package flagged `skuCompilePackage` reachable from its dependencies and `sku lint` runs without path arguments
- **THEN** a warning identifies both versions and their dependency chains, and the lint exit code is unaffected

#### Scenario: Duplicate user-configured compile package versions

- **WHEN** an app lists a package in its `compilePackages` sku config and two versions of it are reachable from its dependencies and `sku lint` runs without path arguments
- **THEN** a warning identifies both versions and their dependency chains, and the lint exit code is unaffected

#### Scenario: Unflagged `@seek` package duplicated

- **WHEN** an app has two versions of an `@seek` package that is not flagged `skuCompilePackage`, is not a default compile package, and is not in its `compilePackages` config
- **THEN** no duplicate warning is printed for that package

### Requirement: Peer version mismatches of candidate packages are reported at lint

When a copy of a candidate package (watched or compile package) declares a peer dependency on another candidate package and the peer copy it actually resolves falls outside the declared semver range, sku SHALL print a warning identifying the declaring package, the expected range, and the resolved version, and SHALL still exit lint successfully. The check is evaluated per declaring copy, non-semver ranges are ignored, prerelease versions satisfy a range they fall within, and the `react-dom` peer on `react` is reported only by the react pair requirement above.

#### Scenario: Resolved peer outside declared range

- **WHEN** a compile package declares a peer dependency on `braid-design-system` at `^31.0.0` and resolves `braid-design-system` at `32.0.0` and `sku lint` runs without path arguments
- **THEN** a warning identifies the expected range and the resolved version, and the lint exit code is unaffected

#### Scenario: Resolved peer satisfies declared range

- **WHEN** a compile package declares a peer dependency on another candidate package and the copy it resolves satisfies the declared range
- **THEN** no peer-mismatch warning is printed for that declaration, even if other copies of the peer exist in the graph

#### Scenario: Non-semver peer range

- **WHEN** a candidate package declares a peer dependency with a non-semver range such as `workspace:*`
- **THEN** no peer-mismatch warning is printed for that declaration

#### Scenario: Prerelease peer within range

- **WHEN** a candidate package declares a peer dependency on `react` at `^19.0.0` and resolves `react` at `19.1.0-canary-abc`
- **THEN** no peer-mismatch warning is printed for that declaration

### Requirement: The check is scoped, skippable, and non-fatal

The duplicate-package check SHALL run only on full `sku lint` runs, SHALL be skipped when the app sets `skuSkipValidatePeerDeps`, and MUST NOT make lint fail or throw when dependencies cannot be resolved.

#### Scenario: Scoped lint run

- **WHEN** `sku lint` is invoked with path arguments in an app with duplicate watched package versions
- **THEN** no duplicate-package warning is printed

#### Scenario: Opted out

- **WHEN** an app's `package.json` sets `skuSkipValidatePeerDeps` and `sku lint` runs without path arguments
- **THEN** no duplicate-package warning is printed

#### Scenario: Dependencies not installed

- **WHEN** `sku lint` runs in an app whose dependencies cannot be resolved
- **THEN** no duplicate-package warning is printed and lint proceeds with its other checks

## REMOVED Requirements

### Requirement: Start and build duplicate package warnings

**Reason**: Replaced by the lint-time duplicate-package check, which covers pnpm as well as npm and yarn; the legacy detection did not run under pnpm, and start/build warnings were easy to miss.

**Migration**: Run `sku lint` to see duplicate-package warnings. Set `skuSkipValidatePeerDeps` in `package.json` to suppress them.
