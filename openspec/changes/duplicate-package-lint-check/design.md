## Context

sku has two disconnected pieces today. `validatePeerDeps` warns about duplicate compile packages and the `@vanilla-extract/css` singleton at start/build/serve time, but returns immediately under pnpm because its `node_modules` crawl assumes npm/yarn nesting. Separately, the Vite service has a dependency-graph walk (`extractDependencyGraph`) that resolves packages the way Node does — and therefore the way pnpm lays them out — but it only records package names, not versions, and is only used to compute SSR `noExternal` entries.

Duplicate versions of `react`, `react-dom`, `braid-design-system`, and `@vanilla-extract/css` cause real failures (broken hooks/context, version-skewed rendering, broken compile packages, Vanilla Extract adapter state split across copies), but start/build warnings are routinely missed. `sku lint` is where developers already expect project-health errors, runs in CI, and is bundler-agnostic.

## Goals / Non-Goals

**Goals:**

- `sku lint` warns when the app's dependency graph resolves any of `react`, `react-dom`, `braid-design-system`, or `@vanilla-extract/css` at more than one distinct version, under pnpm, npm, or yarn.
- `sku lint` warns on the same condition for the app's compile packages (detected `@seek` packages flagged `skuCompilePackage`, sku's default compile packages, and user-configured `compilePackages`), restoring the legacy check's compile-package coverage.
- `sku lint` warns when the resolved `react` and `react-dom` versions differ, and when a candidate package's peer dependency on another candidate resolves outside its declared range (checked per copy, against the copy that package actually resolves).
- Warnings are actionable: versions, locations, and the dependency chain that pulled each copy in, plus a `why` command hint.
- One detection mechanism for all package managers and both bundlers; the pnpm gap and the npm/yarn-only legacy check both disappear.

**Non-Goals:**

- Failing lint or any build. This check never returns a non-zero exit code; future escalation means a more prominent banner, not a failure.
- Proving a copy is in the emitted bundle (Vite plugin / module-graph analysis) — deferred unless lint telemetry shows the graph approximation is too noisy.
- Changing what the graph walk traverses (see Known Limitation).

## Decisions

### 1. Host the check in `sku lint`, warn-only

Add the check to the `checks` list in `lint.action.ts`, gated to full runs (`paths.length === 0`) so scoped lint invocations (`sku lint src/foo.ts`) are unaffected. It always resolves with `exitCode: 0`; findings are printed as a warning banner and counted in telemetry. Rationale: duplicate state only changes when dependencies change, which is exactly when lint runs; a failing check would block unrelated work over transitive duplicates the app may not be able to fix directly, which is why hard errors were explicitly rejected. Start/build-time detection is removed rather than kept as a second surface (Decision 5).

_Alternatives considered:_ a Vite plugin inspecting emitted chunks (accurate, but build-only or, for dev, entangled with the dep optimizer and HMR invalidation) and external tools (`pnpm-lock-buddy`, `@christiango/vite-plugin-duplicate-packages`, `unplugin-detect-duplicated-deps`) — none offer a narrow watchlist, warn-only lint integration, and cross-package-manager support without adopting immature or CLI-only dependencies.

### 2. Detect from the dependency graph, extended with versions

Move `dependencyGraph.ts` from `services/vite/helpers/config/` to `utils/` (updating the `setNoExternal` import and its test), since its consumers are now bundler-agnostic. Add `version` to `DepGraphEntry`, populated from the `package.json` already parsed during the walk at no extra I/O cost; entries with no version (the `ROOT` sentinel, workspace/linked packages) are excluded from version grouping rather than bucketed as `undefined`.

The walk also records each package's `peerDependencies`, its `skuCompilePackage` flag, and `resolutions` — the directory each of its dependencies actually resolved to from its own directory, captured where the walk resolves them. All are populated from data already in hand at no extra I/O cost.

A new pure classifier groups graph entries by package name and emits findings:

- **Duplicate versions**: a candidate package resolves to two or more distinct versions. Distinct directories with the _same_ version (pnpm peer variants) are not user-facing findings; they are debug-logged and counted in telemetry only.
- **React pair mismatch**: the set of resolved `react` versions differs from the set of resolved `react-dom` versions, when both are present. Duplicates of either package are reported independently first.
- **Peer version mismatch**: for each copy of a candidate package, each declared peer dependency on another candidate is checked against the version of the copy that package actually resolves (via `resolutions`); a mismatch is reported per declaring copy with direction-aware advice. Non-semver ranges (e.g. `workspace:*`) are skipped, and the `react-dom` → `react` peer is excluded because the react pair check covers it with a clearer message. This improves on the legacy check, which keyed duplicated packages by name in a `Map` (collapsing copies) and only fired when both sides were already duplicated.

The classifier is a pure function over graph entries so it is unit-testable without a filesystem.

### 3. Candidate set: fixed watchlist plus compile packages

The base watchlist is `react`, `react-dom`, `braid-design-system`, `@vanilla-extract/css`, defined as a constant in the new check module. The candidate set extends it with:

- the app's compile packages, passed from `lint.action.ts` via `skuContext.paths.compilePackages()` — detected `@seek` packages flagged `skuCompilePackage`, sku's defaults (`sku`, `braid-design-system`), and user-configured `compilePackages`; and
- any graph entry whose own `package.json` sets `skuCompilePackage`, so a flagged package is covered even if compile-package detection did not surface it.

This restores the legacy check's compile-package scope without reintroducing its separate `node_modules` crawl: candidate discovery rides on the graph walk that already ran.

### 4. Reporting, telemetry, and opt-out

Each finding prints the package, each resolved version with its directory, a dependency chain per copy derived from graph `dependents` (e.g. "via `lib-a`"), and the package-manager-appropriate `why` hint (`getWhyCommand()` already returns `pnpm why -r` under pnpm). Wording says "resolved in your dependency graph", never "in your bundle". Findings are counted via the existing telemetry provider, reusing the spirit of the `duplicate_compile_package` event.

The check honours `skuSkipValidatePeerDeps` from the app's `package.json`. The flag read currently lives in `configure.ts` as a module-load side effect feeding the legacy wrapper; extract it into a small shared helper the lint check calls directly, so the flag survives deletion of the legacy code (Decision 5) without changing its name or semantics.

### 5. Remove `validatePeerDeps` entirely

Delete `utils/validatePeerDeps.ts`, its wrapper in `utils/configure.ts`, and all invocations (start, Vite and webpack build handlers, build-ssr, serve, webpack start-ssr). The lint check becomes sku's only duplicate detection. Its two legacy behaviours — duplicate detection for compile packages and peer-range mismatch warnings — are preserved and improved by Decisions 2 and 3 (per-copy peer checking, pnpm support, graph reachability instead of a physical `node_modules` crawl). Webpack apps keep full coverage through lint even though webpack itself is deprecated.

### Known Limitation (to document in code)

`extractDependencyGraph` starts from the root package's `dependencies` and follows `dependencies` + `peerDependencies`. Packages reachable only via root `devDependencies` or via `optionalDependencies` are invisible to both `setNoExternal` and this check. Add a comment stating this at the walk's entry point in the moved module. Extending traversal is out of scope and can be revisited if telemetry or bug reports show misses.

## Risks / Trade-offs

- [Graph-reachable ≠ bundled, so some warnings will name copies that tree-shaking or externalisation would have excluded] → Narrow candidate set (fixed watchlist plus compile packages), distinct-versions-only rule, precise wording, and telemetry during a warning-only period before any banner promotion.
- [Compile-package coverage widens the warning surface to `@seek` libraries with long-standing duplicates or loose peer ranges] → Same mitigations: warn-only, per-copy peer checking (no warning when the resolved copy satisfies the range), the `skuSkipValidatePeerDeps` opt-out, and `duplicate_compile_package`/`peer_dep_version_mismatch` telemetry to measure finding rates per package.
- [Under pnpm, `require.resolve` may return the symlinked path rather than the `.pnpm` real path, collapsing distinct copies into one graph key] → Spike/verify with a symlinked fixture before building the classifier on top (tasks 1.1–1.2); if resolution collapses copies, canonicalise with `fs.realpath` in the walk — a contained fix in one place.
- [Removing start/build warnings reduces visibility for teams that rarely run lint] → Accepted trade-off; lint is a required CI check in the target workflow, and the critical-banner promotion path remains available without ever failing a build.
- [Existing apps with long-standing duplicates get new lint noise on sku upgrade] → Warning-only exit behaviour, plus the pre-existing `skuSkipValidatePeerDeps` opt-out; changeset documents the new warning and the removal of the old one.
- [Check runs on fresh clones or missing `node_modules`] → The check swallows resolution/IO errors to debug log and reports nothing; a diagnostic must never break lint.

## Migration Plan

1. Ship behind no flag: lint gains the warning; start/build lose the legacy warnings in the same release (changeset, minor).
2. Monitor telemetry for per-package finding rates to inform a possible future critical-banner promotion (still never a failure).
3. Rollback is a straight revert; the legacy check returns with it. No consumer-side changes are required at any point.

## Open Questions

None blocking. The pnpm-resolution behaviour in Risks is a verification task with a known fallback (`fs.realpath`), not a design decision.
