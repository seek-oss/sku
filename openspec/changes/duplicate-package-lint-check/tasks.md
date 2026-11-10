## 1. Verify pnpm resolution behaviour

- [ ] 1.1 Add a throwaway symlinked fixture (pnpm-style `.pnpm` store with two copies of a package at different versions) and confirm `extractDependencyGraph` keys the copies as distinct directories; delete the throwaway or keep it as the seed for task 5.2
- [ ] 1.2 If copies collapse to one key, canonicalise package directories with `fs.realpath` in the walk and re-verify; if not, record that no change was needed

## 2. Dependency graph: shared location, versions, documented limitation

- [ ] 2.1 Move `packages/sku/src/services/vite/helpers/config/dependencyGraph.ts` (and its test) to `packages/sku/src/utils/dependencyGraph.ts`; update the `setNoExternal` import; confirm existing tests pass unchanged
- [ ] 2.2 Add `version` to `DepGraphEntry`, populated from the already-parsed `package.json`; `ROOT` carries no version
- [ ] 2.3 Add a comment at the walk entry point documenting the known limitation: only root `dependencies` are walked (plus transitive `dependencies`/`peerDependencies`), so packages reachable only via root `devDependencies` or `optionalDependencies` are not represented

## 3. Duplicate classification

- [ ] 3.1 Create the duplicate-check module with the fixed watchlist (`react`, `react-dom`, `braid-design-system`, `@vanilla-extract/css`)
- [ ] 3.2 Implement the pure classifier: group entries by name; emit a finding when a watched package has 2+ distinct versions (entries without a version excluded); same-version duplicate directories produce debug/telemetry output only
- [ ] 3.3 Implement the `react`/`react-dom` version-set pair check (only when both are present)
- [ ] 3.4 Build each finding's report data: versions, directories, a dependency chain per copy derived from `dependents`, and the `getWhyCommand()` hint
- [ ] 3.5 Unit-test the classifier: duplicate distinct versions, same-version multiple directories (no finding), pair match/mismatch, missing versions ignored, unwatched packages ignored

## 4. Lint integration

- [ ] 4.1 Extract the `skuSkipValidatePeerDeps` read from `configure.ts` into a shared helper usable from the lint path
- [ ] 4.2 Implement the lint check: skip when opted out or dependencies are unresolvable (errors swallowed to debug log); otherwise run the graph walk, classify, print a warning banner, and count findings in telemetry; always resolve with `exitCode: 0`
- [ ] 4.3 Register the check in `lint.action.ts`, gated to full runs (`paths.length === 0`)
- [ ] 4.4 Add/extend graph tests for version recording and for npm/yarn-style nested layouts vs pnpm-style symlinked layouts producing equivalent findings

## 5. Remove legacy validation

- [ ] 5.1 Delete `packages/sku/src/utils/validatePeerDeps.ts` and the `validatePeerDeps` wrapper in `utils/configure.ts`
- [ ] 5.2 Remove `validatePeerDeps` imports and calls from: `start.action.ts`, `build/vite-build-handler.ts`, `build/webpack-build-handler.ts`, `build-ssr/build-ssr.action.ts`, `serve/serve.action.ts`, `start-ssr/webpack-start-ssr-handler.ts`
- [ ] 5.3 Search the repo for remaining `validatePeerDeps` references (excluding built `dist` output) and confirm none remain; confirm start/build/serve still typecheck and behave as before

## 6. End-to-end coverage

- [ ] 6.1 Add a lint test fixture/app state with duplicate `react` versions and assert the warning appears in `sku lint` output while lint succeeds
- [ ] 6.2 Assert no duplicate warning appears for: a scoped lint run (`sku lint <path>`), an app with `skuSkipValidatePeerDeps`, and an app with a single version of each watched package
- [ ] 6.3 Run sku's own lint/test suites to check fixtures that set `skuSkipValidatePeerDeps` still behave, and fix any fixture fallout

## 7. Release

- [ ] 7.1 Add a changeset (minor) describing the new lint warning, pnpm support, and the removal of start/build duplicate warnings
- [ ] 7.2 Check site docs for `validatePeerDeps`/`skuSkipValidatePeerDeps` mentions and update only if the documented behaviour changed
- [ ] 7.3 Run `pnpm openspec validate duplicate-package-lint-check` and the targeted test suites; note any full-suite failures unrelated to this change
