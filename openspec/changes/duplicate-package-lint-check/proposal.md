## Why

Move sku's duplicate-package check into `sku lint`, and make it work with pnpm.

Duplicate versions of `react`, `react-dom`, `braid-design-system`, or `@vanilla-extract/css` can break rendering, hooks, context, styling, or compile packages. sku's current check does not run with pnpm, and developers often miss its warnings during start and build. Developers already look for project health errors in `sku lint`.

## What Changes

- Full `sku lint` runs warn when one of those four packages, or one of the app's compile packages, resolves at more than one version. The check looks at everything reachable from the app's `dependencies` and `devDependencies`.
- Lint also warns when `react-dom` loads a different `react` version, and when a checked package's peer dependency on another checked package resolves outside its range.
- The check uses sku's dependency graph walk, which works with pnpm, npm, and yarn. The walk now records versions and peer dependencies.
- The walk no longer skips packages whose `exports` field leaves out `./package.json`. This also adds missing Vite `noExternal` entries for packages that depend on Vanilla Extract.
- `skuSkipValidatePeerDeps` still turns the check off.
- Remove `validatePeerDeps` and its calls from the start, build, and serve commands. Lint becomes the only duplicate check.

Non-goals: lint or build failures, and analysis of the bundle or import graph.

## Capabilities

### New Capabilities

- `duplicate-package-detection`: lint warnings for duplicate and mismatched versions of checked packages.

### Modified Capabilities

<!-- None. -->

## Impact

- Code: the `sku lint` command, the dependency graph helper (moved to `utils/`), `validatePeerDeps` and its calls in the start, build, and serve handlers, and the `configure` wrapper. The walk fix also changes Vite `noExternal`.
- No new dependencies and no public API changes. A minor changeset covers the lint check, and a patch changeset covers the `noExternal` fix. `site/docs/linting.md` gets a section on the warnings and the `skuSkipValidatePeerDeps` flag.
