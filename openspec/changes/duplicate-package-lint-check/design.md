## Context

sku has two disconnected pieces today. `validatePeerDeps` warns about duplicate compile packages and the `@vanilla-extract/css` singleton at start/build/serve time, but returns immediately under pnpm because its `node_modules` crawl assumes npm/yarn nesting. Separately, the Vite service has a dependency-graph walk (`extractDependencyGraph`) that resolves packages the way Node does — and therefore the way pnpm lays them out — but it only records package names, not versions, and is only used to compute SSR `noExternal` entries.

Duplicate versions of `react`, `react-dom`, `braid-design-system`, and `@vanilla-extract/css` cause real failures (broken hooks/context, version-skewed rendering, broken compile packages, Vanilla Extract adapter state split across copies), but start/build warnings are routinely missed. `sku lint` is where developers already expect project-health errors, runs in CI, and is bundler-agnostic.

## Goals / Non-Goals

**Goals:**

- `sku lint` warns when the app's dependency graph resolves any of `react`, `react-dom`, `braid-design-system`, or `@vanilla-extract/css` at more than one distinct version, under pnpm, npm, or yarn.
- `sku lint` warns on the same condition for the app's compile packages (detected `@seek` packages flagged `skuCompilePackage`, sku's default compile packages, and user-configured `compilePackages`), restoring the legacy check's compile-package coverage.
- `sku lint` warns when a `react-dom` copy resolves a `react` copy at a different version, and when a candidate package's peer dependency on another candidate resolves outside its declared range (both checked per copy, against the copy that package actually resolves).
- Warnings are actionable: versions, locations, and the dependency chain that pulled each copy in, plus a `why` command hint.
- One detection mechanism for all package managers and both bundlers; the pnpm gap and the npm/yarn-only legacy check both disappear.

**Non-Goals:**

- Failing lint or any build. This check never returns a non-zero exit code; future escalation means a more prominent banner, not a failure.
- Proving a copy is in the emitted bundle (Vite plugin / module-graph analysis) — deferred unless lint telemetry shows the graph approximation is too noisy.
- Walking `optionalDependencies` (see Known Limitation).

## Decisions

### 1. Host the check in `sku lint`, warn-only

Add the check to the `checks` list in `lint.action.ts`, gated to full runs (`paths.length === 0`) so scoped lint invocations (`sku lint src/foo.ts`) are unaffected. It always resolves with `exitCode: 0`; findings are printed as a warning banner and counted in telemetry. Rationale: duplicate state only changes when dependencies change, which is exactly when lint runs; a failing check would block unrelated work over transitive duplicates the app may not be able to fix directly, which is why hard errors were explicitly rejected. Start/build-time detection is removed rather than kept as a second surface (Decision 5).

_Alternatives considered:_ a Vite plugin inspecting emitted chunks (accurate, but build-only or, for dev, entangled with the dep optimizer and HMR invalidation) and external tools (`pnpm-lock-buddy`, `@christiango/vite-plugin-duplicate-packages`, `unplugin-detect-duplicated-deps`) — none offer a narrow watchlist, warn-only lint integration, and cross-package-manager support without adopting immature or CLI-only dependencies.

### 2. Detect from the dependency graph, extended with versions

Move `dependencyGraph.ts` from `services/vite/helpers/config/` to `utils/` (updating the `setNoExternal` import and its test), since its consumers are now bundler-agnostic. Add `version` and `peerDependencies` to `DepGraphEntry`, populated from the `package.json` already parsed during the walk at no extra I/O cost; entries with no version (the `ROOT` sentinel) are excluded from version grouping rather than bucketed as `undefined`.

The walk finds each package directory by searching Node's `node_modules` lookup paths for `<dep>/package.json` and taking its real path. Resolving `<dep>/package.json` through module resolution throws for packages whose `exports` omit it, which silently dropped about 13% of sku's own dependency graph, along with anything reachable only through those packages. The real path keeps each pnpm store copy under its own key.

The graph needs no separate record of which copy a package resolves: every resolved edge from package A to package B adds A to B's `dependents`, so the copy of peer P that a package resolves is the P entry whose `dependents` include that package's directory.

A pure classifier groups candidate copies by package name and emits findings:

- **Duplicate versions**: a candidate package resolves to two or more distinct versions. Distinct directories with the _same_ version (pnpm peer variants) are not reported.
- **Peer version mismatch**: for each copy of a candidate package, each declared peer dependency on another candidate is checked against the version of the copy that package actually resolves; a mismatch is reported per declaring copy with direction-aware advice. Non-semver ranges (e.g. `workspace:*`) are skipped, and prereleases count as within a range (`includePrerelease`). This improves on the legacy check, which keyed duplicated packages by name in a `Map` (collapsing copies) and only fired when both sides were already duplicated.
- **React pair mismatch**: a special case of the peer check. React requires `react-dom` and the `react` it loads to be the same version, so a `react-dom` copy's `react` peer must resolve exactly that `react-dom` copy's version, whatever its declared range. Comparing per copy, rather than comparing all resolved `react` versions with all resolved `react-dom` versions, avoids reporting a mismatch when an unrelated duplicate `react` exists; that duplicate is reported on its own.

The classifier is a pure function over graph entries so it is unit-testable without a filesystem.

### 3. Candidate set: fixed watchlist plus compile packages

The base watchlist is `react`, `react-dom`, `braid-design-system`, `@vanilla-extract/css`, defined as a constant in the new check module. The candidate set extends it with the app's compile packages, passed from `lint.action.ts` via `skuContext.paths.compilePackages()`: detected `@seek` packages flagged `skuCompilePackage`, sku's defaults (`sku`, `braid-design-system`), and user-configured `compilePackages`.

This restores the legacy check's compile-package scope using the same source of truth sku uses to decide what to compile. A flagged package that compile-package detection doesn't find isn't compiled by sku either, so the graph doesn't record the flag separately.

### 4. Reporting, telemetry, and opt-out

Each finding prints the package, each resolved version with its directory, a dependency chain per copy derived from graph `dependents` (e.g. "via `lib-a`"), and the package-manager-appropriate `why` hint (`getWhyCommand()` already returns `pnpm why -r` under pnpm). Wording says "resolved in your dependency graph", never "in your bundle". Findings are counted via the existing telemetry provider, reusing the spirit of the `duplicate_compile_package` event.

The check honours `skuSkipValidatePeerDeps` from the app's `package.json`. The flag read currently lives in `configure.ts` as a module-load side effect feeding the legacy wrapper; the check reads it from the root `package.json` itself, so the flag survives deletion of the legacy code (Decision 5) without changing its name or semantics.

### 5. Remove `validatePeerDeps` entirely

Delete `utils/validatePeerDeps.ts`, its wrapper in `utils/configure.ts`, and all invocations (start, Vite and webpack build handlers, build-ssr, serve, webpack start-ssr). The lint check becomes sku's only duplicate detection. Its two legacy behaviours — duplicate detection for compile packages and peer-range mismatch warnings — are preserved and improved by Decisions 2 and 3 (per-copy peer checking, pnpm support, graph reachability instead of a physical `node_modules` crawl). Webpack apps keep full coverage through lint even though webpack itself is deprecated.

### 6. Walk root `devDependencies` for the lint check

`extractDependencyGraph` starts from the root package's `dependencies` and follows `dependencies` + `peerDependencies`. The lint check also passes `includeDevDependencies`, so the walk starts from the root `devDependencies` too. `sku init` installs `@vanilla-extract/css` as a devDependency, so without this the app's own copy never enters the graph, and a version mismatch with the copy braid resolves goes unreported. Apps that keep `react` or `braid-design-system` in devDependencies are covered the same way. `setNoExternal` keeps walking `dependencies` only.

### Known Limitation (to document in code)

`optionalDependencies` are not walked, so packages reachable only through them are invisible to both `setNoExternal` and this check. A comment at the walk's entry point states this.

## Risks / Trade-offs

- [Graph-reachable ≠ bundled, so some warnings will name copies that tree-shaking or externalisation would have excluded] → Narrow candidate set (fixed watchlist plus compile packages), distinct-versions-only rule, precise wording, and telemetry during a warning-only period before any banner promotion.
- [Compile-package coverage widens the warning surface to `@seek` libraries with long-standing duplicates or loose peer ranges] → Same mitigations: warn-only, per-copy peer checking (no warning when the resolved copy satisfies the range), the `skuSkipValidatePeerDeps` opt-out, and `duplicate_compile_package`/`peer_dep_version_mismatch` telemetry to measure finding rates per package.
- [Under pnpm, a symlinked path rather than the `.pnpm` real path would collapse distinct copies into one graph key] → The walk takes the real path of every package directory it finds; a symlinked fixture test covers it.
- [Walking `devDependencies` also walks sku's own tree, which has its own `@vanilla-extract/css` through `@vanilla-extract/integration`, so a version that differs from the app's is reported] → It's a real second copy, and the legacy check reported it too. It's lower-risk than an app/braid mismatch, because the integration binds the CSS adapter from inside each evaluated file, so the adapter uses whichever copy that file resolves.
- [The walk changes alter Vite `noExternal` for Vanilla Extract dependents, now that packages hiding `package.json` are found] → The list only grows, and every package added is a real dependent of `@vanilla-extract/css`; a patch changeset covers it.
- [Removing start/build warnings reduces visibility for teams that rarely run lint] → Accepted trade-off; lint is a required CI check in the target workflow, and the critical-banner promotion path remains available without ever failing a build.
- [Existing apps with long-standing duplicates get new lint noise on sku upgrade] → Warning-only exit behaviour, plus the pre-existing `skuSkipValidatePeerDeps` opt-out; changeset documents the new warning and the removal of the old one.
- [Check runs on fresh clones or missing `node_modules`] → The check swallows resolution/IO errors to debug log and reports nothing; a diagnostic must never break lint.

## Migration Plan

1. Ship behind no flag: lint gains the warning; start/build lose the legacy warnings in the same release (changeset, minor).
2. Monitor telemetry for per-package finding rates to inform a possible future critical-banner promotion (still never a failure).
3. Rollback is a straight revert; the legacy check returns with it. No consumer-side changes are required at any point.

## Open Questions

None blocking. Lint never closes the telemetry provider (the build handlers do), so check whether `@seek/sku-telemetry` buffers counts before relying on lint telemetry.
