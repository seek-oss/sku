## 1. Verify pnpm resolution behaviour

- [x] 1.1 Add a throwaway symlinked fixture (pnpm-style `.pnpm` store with two copies of a package at different versions) and confirm `extractDependencyGraph` keys the copies as distinct directories; delete the throwaway or keep it as the seed for task 5.2
- [x] 1.2 If copies collapse to one key, canonicalise package directories with `fs.realpath` in the walk and re-verify; if not, record that no change was needed (verified: no change needed — `require.resolve` returns real paths under pnpm symlinks, so copies are keyed distinctly; covered by the pnpm symlink test in `dependencyGraph.test.ts`)

## 2. Dependency graph: shared location, versions, documented limitation

- [x] 2.1 Move `packages/sku/src/services/vite/helpers/config/dependencyGraph.ts` (and its test) to `packages/sku/src/utils/dependencyGraph.ts`; update the `setNoExternal` import; confirm existing tests pass unchanged
- [x] 2.2 Add `version` to `DepGraphEntry`, populated from the already-parsed `package.json`; `ROOT` carries no version
- [x] 2.3 Add a comment at the walk entry point documenting the known limitation: only root `dependencies` are walked (plus transitive `dependencies`/`peerDependencies`), so packages reachable only via root `devDependencies` or `optionalDependencies` are not represented

## 3. Duplicate classification

- [x] 3.1 Create the duplicate-check module with the fixed watchlist (`react`, `react-dom`, `braid-design-system`, `@vanilla-extract/css`)
- [x] 3.2 Implement the pure classifier: group entries by name; emit a finding when a watched package has 2+ distinct versions (entries without a version excluded); same-version duplicate directories produce debug/telemetry output only
- [x] 3.3 Implement the `react`/`react-dom` version-set pair check (only when both are present)
- [x] 3.4 Build each finding's report data: versions, directories, a dependency chain per copy derived from `dependents`, and the `getWhyCommand()` hint
- [x] 3.5 Unit-test the classifier: duplicate distinct versions, same-version multiple directories (no finding), pair match/mismatch, missing versions ignored, unwatched packages ignored

## 4. Lint integration

- [x] 4.1 Extract the `skuSkipValidatePeerDeps` read from `configure.ts` into a shared helper usable from the lint path
- [x] 4.2 Implement the lint check: skip when opted out or dependencies are unresolvable (errors swallowed to debug log); otherwise run the graph walk, classify, print a warning banner, and count findings in telemetry; always resolve with `exitCode: 0`
- [x] 4.3 Register the check in `lint.action.ts`, gated to full runs (`paths.length === 0`)
- [x] 4.4 Add/extend graph tests for version recording and for npm/yarn-style nested layouts vs pnpm-style symlinked layouts producing equivalent findings

## 5. Remove legacy validation

- [x] 5.1 Delete `packages/sku/src/utils/validatePeerDeps.ts` and the `validatePeerDeps` wrapper in `utils/configure.ts`
- [x] 5.2 Remove `validatePeerDeps` imports and calls from: `start.action.ts`, `build/vite-build-handler.ts`, `build/webpack-build-handler.ts`, `build-ssr/build-ssr.action.ts`, `serve/serve.action.ts`, `start-ssr/webpack-start-ssr-handler.ts`
- [x] 5.3 Search the repo for remaining `validatePeerDeps` references (excluding built `dist` output) and confirm none remain; confirm start/build/serve still typecheck and behave as before

## 6. End-to-end coverage

- [x] 6.1 Add a lint test fixture/app state with duplicate `react` versions and assert the warning appears in `sku lint` output while lint succeeds
- [x] 6.2 Assert no duplicate warning appears for: a scoped lint run (`sku lint <path>`), an app with `skuSkipValidatePeerDeps`, and an app with a single version of each watched package
- [x] 6.3 Run sku's own lint/test suites to check fixtures that set `skuSkipValidatePeerDeps` still behave, and fix any fixture fallout

## 7. Release

- [x] 7.1 Add a changeset (minor) describing the new lint warning, pnpm support, and the removal of start/build duplicate warnings
- [x] 7.2 Check site docs for `validatePeerDeps`/`skuSkipValidatePeerDeps` mentions and update only if the documented behaviour changed
- [x] 7.3 Run `pnpm openspec validate duplicate-package-lint-check` and the targeted test suites; note any full-suite failures unrelated to this change

## 8. Compile-package parity (follow-up)

- [x] 8.1 Record `peerDependencies`, the `skuCompilePackage` flag, and per-package `resolutions` (which copy each dependency resolved to) on `DepGraphEntry`, populated during the existing graph walk
- [x] 8.2 Generalise the classifier beyond the fixed watchlist: the watchlist plus caller-supplied `extraPackages` plus any graph entry flagged `skuCompilePackage`
- [x] 8.3 Add the per-copy peer-version mismatch pass (checked packages only, semver ranges only, `react-dom` → `react` excluded in favour of the pair check) with direction-aware fix advice and `peer_dep_version_mismatch` telemetry
- [x] 8.4 Pass `skuContext.paths.compilePackages()` from `lint.action.ts` into the duplicate-package check as `extraPackages`
- [x] 8.5 Unit/integration-test: flagged `@seek` duplicates, caller-supplied `extraPackages`, unflagged `@seek` ignored, peer satisfied/mismatched per copy, non-semver ranges ignored, and graph recording of the new entry fields
- [x] 8.6 Update the proposal, design, spec delta, and changeset for the restored compile-package coverage

## 9. Review follow-ups

See `review.md` for the findings behind these tasks. They supersede parts of 1.2, 2.3, 3.2, 3.3, 4.1, 8.1, and 8.2.

- [x] 9.1 Find package directories through Node's `node_modules` lookup paths and their real paths, so packages whose `exports` omit `./package.json` stay in the graph
- [x] 9.2 Add an `includeDevDependencies` option to the walk and pass it from the lint check; `setNoExternal` keeps walking `dependencies` only
- [x] 9.3 Drop `resolutions` and the `skuCompilePackage` flag from `DepGraphEntry`; derive the resolved copy of a peer from `dependents`, and take compile packages from `compilePackages()` only
- [x] 9.4 Replace the `react`/`react-dom` version-set check with a per-copy exact-version peer check
- [x] 9.5 Treat prereleases within a peer range as satisfying it, and stop logging same-version copies
- [x] 9.6 Read `skuSkipValidatePeerDeps` in the check itself and delete the shared helper
- [x] 9.7 Sort copies so warnings print in a stable order
- [x] 9.8 Test packages that hide `package.json`, devDependency walking, pnpm store symlinks, and the per-copy react check
- [x] 9.9 Update the proposal, design, spec delta, and changeset; add a patch changeset for the Vite `noExternal` fix
