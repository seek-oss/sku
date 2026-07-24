# Delta for lint-typescript-projects

## ADDED Requirements

### Requirement: Eslint import resolver SHALL use a single tsconfig entry point

The eslint import resolver SHALL use a single `tsconfig.eslint.json` at the repo root as its entry point, rather than a glob that discovers multiple tsconfig files across the tree. The resolver SHALL follow the file's `references` to discover the real source-package projects.

#### Scenario: A from-scratch lint run produces no multi-project warning

- GIVEN the eslint cache does not exist
- WHEN `pnpm lint:eslint` runs
- THEN the output does not contain the string "Multiple projects found"
- AND the resolver does not emit a multi-project warning to stderr

#### Scenario: Resolver loads only referenced source projects

- GIVEN `tsconfig.eslint.json` references the root `tsconfig.json` and the 9 source-package tsconfigs
- WHEN `pnpm lint:eslint` runs with `DEBUG=eslint-import-resolver-typescript`
- THEN the resolver's `resolved projects` log does not include any path under `fixtures/`
- AND the resolver's `resolved projects` log does not include any path under `node_modules/`

### Requirement: `tsconfig.eslint.json` SHALL reference all source packages and exclude fixtures

The `tsconfig.eslint.json` file SHALL declare `references` to the root `tsconfig.json` and to every source package under `packages/` and `private/` that has its own `tsconfig.json`. It SHALL NOT reference any tsconfig under `fixtures/`.

#### Scenario: New source package is added

- GIVEN a new package `packages/<name>/tsconfig.json` is added to the monorepo
- WHEN `tsconfig.eslint.json` is not updated to reference it
- THEN the eslint import resolver has no awareness of that package's tsconfig
- AND imports into that package may resolve with reduced type accuracy

#### Scenario: Fixture tsconfig is never loaded by the resolver

- GIVEN `fixtures/example/tsconfig.json` exists
- WHEN `pnpm lint:eslint` runs
- THEN the resolver does not load `fixtures/example/tsconfig.json`
- AND the resolver does not perform a filesystem glob to discover it

### Requirement: Resolver configuration SHALL not change typecheck or build behaviour

The change to the eslint import resolver SHALL NOT modify the root `tsconfig.json`, any per-package `tsconfig.json` or `tsconfig.build.json`, the `lint:tsc` script, or any build configuration. The `tsconfig.eslint.json` file SHALL be used solely by the eslint import resolver.

#### Scenario: lint:tsc behaviour is unchanged

- GIVEN the change is applied
- WHEN `pnpm lint:tsc` runs
- THEN the set of files typechecked is identical to before the change
- AND the compiler options applied are identical to before the change

#### Scenario: Build output is unchanged

- GIVEN the change is applied
- WHEN `pnpm build` runs
- THEN the build outputs are byte-equivalent to before the change
