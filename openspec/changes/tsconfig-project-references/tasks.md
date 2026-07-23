## 1. Prerequisite

- [ ] 1.1 Confirm `eslint-tsconfig-references` is archived (or archive it) so the `lint-typescript-projects` capability exists in `openspec/specs/` before this change's delta is applied

## 2. Make source packages composite

- [ ] 2.1 Add `"rootDir": "./src"` and `"composite": true` to `packages/sku/tsconfig.json`, `packages/vite/tsconfig.json`, and `packages/pnpm-plugin/tsconfig.json`
- [ ] 2.2 Add `"composite": true` to the remaining 6 packages' `tsconfig.json` (`packages/codemod`, `packages/create`, `packages/babel-plugin-display-name`, `private/utils`, `private/inject-changelog-preamble`, `private/react-lib-with-loadable`), which already have `rootDir`
- [ ] 2.3 Run `tsc --noEmit` (or the package's `lint:tsc`) for each of the 9 packages individually and fix any new errors surfaced by `composite`'s stricter file-scoping checks

## 3. Wire the reference graph

- [ ] 3.1 Add `references` to the root `tsconfig.json` pointing at all 9 source-package tsconfigs
- [ ] 3.2 Remove `packages/sku`, `packages/codemod`, `packages/create` from the root `tsconfig.json`'s `exclude`, if `references` supersedes the exclusion
- [ ] 3.3 Audit each package's actual `import` graph against its declared `references` to confirm no cross-package import is missing a reference

## 4. Switch `lint:tsc` to `tsc --build`

- [ ] 4.1 Change the root `lint:tsc` script from `tsc` to `tsc --build`
- [ ] 4.2 Decide whether `lint:tsc:sku` is still needed or superseded by `tsc --build`, and update or remove it accordingly
- [ ] 4.3 Run `pnpm lint:tsc` from scratch (no `.tsbuildinfo` files) and confirm the reported errors match a plain `tsc` baseline taken before this change
- [ ] 4.4 Make an isolated change to one package's source, re-run `pnpm lint:tsc`, and confirm the build log shows unrelated packages as up to date

## 5. Reconcile with the eslint resolver config

- [ ] 5.1 Prefer consolidating onto one root references config: point the eslint resolver's `configFile` at the root `tsconfig.json` if that works, otherwise keep a thin renamed alias rather than a second parallel references list
- [ ] 5.2 Delete or rename `tsconfig.eslint.json` accordingly (and update its knip ignore entry, if any)
- [ ] 5.3 Run `pnpm lint:eslint` and confirm no "Multiple projects found" warning appears and no new lint errors are reported

## 6. Verify build output is unchanged

- [ ] 6.1 Run `pnpm build` for each of the 9 source packages before and after the change and diff the output directories for byte-equivalence

## 7. Docs and changelog

- [ ] 7.1 Add a changeset describing the `lint:tsc` behavior change (internal tooling only, no consumer-facing impact)
