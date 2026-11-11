## Why

Duplicate versions of `react`, `react-dom`, `braid-design-system`, or `@vanilla-extract/css` can break rendering, hooks/context, styling, or compile-package behaviour. sku's existing duplicate detection does not run under pnpm, and its start/build warnings are easy to miss; dependency problems are better surfaced where developers already expect project-health errors: `sku lint`.

## What Changes

- Add a warn-only duplicate-package check to full `sku lint` runs. It reports distinct versions of the four packages above that are reachable from the app's dependencies or devDependencies, plus a `react-dom` copy that resolves a different `react` version.
- Extend the candidate set beyond the fixed watchlist to the app's compile packages (`skuContext.paths.compilePackages()`: detected `@seek` packages flagged `skuCompilePackage`, sku's default compile packages, and user-configured `compilePackages`). Warn when a candidate package's peer dependency on another candidate resolves outside its declared range, restoring (and improving on) the legacy compile-package coverage.
- Reuse the existing dependency-graph walk, extended to record package versions and peer dependencies. The walk is package-manager agnostic, so it works with pnpm, npm, and yarn. The lint check also seeds it with the root `devDependencies`, because `sku init` installs `@vanilla-extract/css` as one.
- Fix the walk skipping packages whose `exports` field doesn't include `./package.json`. This also fixes missing Vite `noExternal` entries for Vanilla Extract dependents.
- Keep `skuSkipValidatePeerDeps` as the opt-out.
- Remove `validatePeerDeps` and its start/build/serve invocations; the lint check becomes sku's only duplicate detection, with broader coverage than the legacy check (it also runs under pnpm).
- Non-goals: no hard lint/build failure, and no bundler/import-graph analysis.

## Capabilities

### New Capabilities

- `duplicate-package-detection`: warn-only lint detection of duplicate versions of watched packages in the app's dependency graph.

### Modified Capabilities

<!-- None. -->

## Impact

- Affected code: `packages/sku` lint command, dependency-graph helper (moved to a shared location; its resolution fix also changes Vite `noExternal`), `validatePeerDeps` and its call sites in start/build/serve handlers, and the `configure` wrapper.
- No new dependencies. Requires a minor changeset for the lint check and a patch changeset for the `noExternal` fix; docs only if the skip flag's documentation needs updating.
