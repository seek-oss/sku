## 1. Dependency graph

- [ ] 1.1 Change `dependencyGraph.ts` to record every copy of a package (directory, version, dependents) instead of throwing on a second version
- [ ] 1.2 Update `setNoExternal.ts` to use the dependents of all `@vanilla-extract/css` copies
- [ ] 1.3 Memoize the walk so one process walks the tree once
- [ ] 1.4 Unit tests: two versions, same version in two directories, one copy

## 2. Plugin

- [ ] 2.1 Add a helper that gets the package name and directory from a module ID. Unit test scoped names, pnpm paths, and paths outside `node_modules`.
- [ ] 2.2 Add the plugin in `services/vite/plugins/`. In build, read client output chunks in `generateBundle`.
- [ ] 2.3 In serve, find duplicates in the dependency graph after the server listens
- [ ] 2.4 Print one `caution` banner per duplicate package with each copy's version, directory, and the `getWhyCommand()` suggestion. Send `duplicate_compile_package` telemetry. Report each package once per process.
- [ ] 2.5 Add the plugin to `skuPlugin`

## 3. Remove the old check

- [ ] 3.1 Remove `utils/validatePeerDeps.ts` and the `validatePeerDeps` export in `utils/configure.ts`
- [ ] 3.2 Remove the `validatePeerDeps` calls in the start, serve, build, and build-ssr handlers
- [ ] 3.3 Remove `peer_dep_version_mismatch` from the telemetry types
- [ ] 3.4 Remove `skuSkipValidatePeerDeps` from the root `package.json`, all fixtures, `tests/node/configure.test.ts`, and the `sort-package-json` snapshot

## 4. End-to-end tests

- [ ] 4.1 Add a fixture whose client bundle contains two copies of a checked package
- [ ] 4.2 Test that `sku build` prints one warning and exits with code 0
- [ ] 4.3 Test that `sku start` prints the warning and keeps serving
- [ ] 4.4 Run the existing test suites and fix any fixture that now has a duplicate

## 5. Docs and release

- [ ] 5.1 Document the check, the checked packages, and how to fix duplicates in `site/docs`
- [ ] 5.2 Add a minor changeset for the new check. Say that `skuSkipValidatePeerDeps` no longer exists.
