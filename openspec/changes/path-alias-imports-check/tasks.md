## 1. Core: split pathAliasImports into sync/check/assert

- [ ] 1.1 In `packages/sku/src/utils/pathAliasImports.ts`, extract the shared core: read `package.json` (absent → `undefined`), compute the expected contents (set/delete `imports`, `JSON.stringify(pkg, null, 2) + '\n'`)
- [ ] 1.2 Keep `syncPathAliasImports` behavior unchanged on top of the core (write when different)
- [ ] 1.3 Add `checkPathAliasImports(pathAliases): Promise<LintResult>`. Return `{ exitCode: 0 }` when in sync or no `package.json`. Otherwise print the drift and `suggestScript('format')` and return `{ exitCode: 1 }`. Never write.
- [ ] 1.4 Add `assertPathAliasImports(pathAliases)`: throws on drift with the same message. No-op when in sync or no `package.json`.
- [ ] 1.5 Unit tests in `pathAliasImports.test.ts`: check passes in sync / fails on missing, stale, or reordered entries / passes with no `package.json`. Assert throws on drift. Sync behavior unchanged.

## 2. Delete the step from configure

- [ ] 2.1 Delete the `syncPathAliasImports` call and import from `packages/sku/src/utils/configureApp.ts`
- [ ] 2.2 Check `configure.test.ts` still passes and covers `imports` left untouched

## 3. Wire lint and format

- [ ] 3.1 `lint.action.ts`: add `{ name: 'Path alias imports', run: () => checkPathAliasImports(skuContext.pathAliases) }` to the `LintCheck[]` array
- [ ] 3.2 `format.action.ts`: add the sync step first in its `LintCheck[]` array, before the ESLint fix, so the `package.json` sort converges in one run. Return `{ exitCode: 0 }` after a successful sync.

## 4. Gate commands that resolve `#` imports

- [ ] 4.1 `test.action.ts`: call `assertPathAliasImports(skuContext.pathAliases)` after `configureProject`
- [ ] 4.2 `start.action.ts`: assert before the `Promise.all` that starts the vocab watcher (fail fast, no side effects)
- [ ] 4.3 `webpack-start-ssr-handler.ts`: assert before server startup
- [ ] 4.4 `build-ssr.action.ts`: assert after `configureProject`
- [ ] 4.5 `webpack-build-handler.ts` and `vite-build-handler.ts`: assert after `configureProject` (both handlers)

## 5. Fixtures and e2e coverage

- [ ] 5.1 Audit fixtures using `pathAliases` (`lint-format`, `path-aliases`, any others) and commit in-sync `package.json#imports`
- [ ] 5.2 `tests/node/lint-format.test.ts`: lint fails on drifted imports with the suggestion message, format fixes them, then lint passes
- [ ] 5.3 Add e2e coverage that a gated command (e.g. `sku test`) fails fast on drift and that `sku configure` leaves a drifted `package.json` untouched with exit 0
- [ ] 5.4 Add e2e coverage that `skuSkipConfigure: true` does not disable the lint check

## 6. Docs and release

- [ ] 6.1 Update `site/docs/linting.md` with the path alias imports check/fix
- [ ] 6.2 Update the `configure` section of `site/docs/cli.md` (no longer touches `package.json#imports`)
- [ ] 6.3 Add a minor changeset describing the behavior change and the `sku format` migration step
