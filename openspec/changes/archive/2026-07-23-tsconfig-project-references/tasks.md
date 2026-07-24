## 1. Prerequisite

- [x] 1.1 Confirm `eslint-tsconfig-references` is archived (or archive it) so the `lint-typescript-projects` capability exists in `openspec/specs/` before this change's delta is applied

## 2. Benchmark baseline

- [x] 2.1 Time a from-scratch `pnpm lint:tsc` (no `.tsbuildinfo`) and record wall-clock duration
  - Baseline from-scratch: **3.30s** real (`rm -rf node_modules/.cache/typescript` then `nr lint:tsc`)
- [x] 2.2 Make an isolated one-package source change, time `pnpm lint:tsc` again, and record wall-clock duration as the pre-change incremental baseline
  - Baseline incremental (touched `packages/vite/src/loadable/collector.ts`): **2.55s** real
  - Note: `lint:tsc:sku` alone was **4.94s** real (sku is excluded from root `tsc` today)

## 3. Make source packages composite

- [x] 3.1 Add `"rootDir": "./src"` and `"composite": true` to `packages/sku/tsconfig.json`, `packages/vite/tsconfig.json`, and `packages/pnpm-plugin/tsconfig.json`
  - Also dropped `tsdown.config.ts` from `packages/sku` include so it stays under `rootDir: "./src"` (vite already had `rootDir`)
- [x] 3.2 Add `"composite": true` to the remaining 6 packages' `tsconfig.json` (`packages/codemod`, `packages/create`, `packages/babel-plugin-display-name`, `private/utils`, `private/inject-changelog-preamble`, `private/react-lib-with-loadable`), which already have `rootDir`
  - `packages/create` was missing `rootDir`; added it. Dropped `tsdown.config.ts` from `packages/codemod` and `packages/create` includes for the same reason
- [x] 3.3 Run `tsc --noEmit` (or the package's `lint:tsc`) for each of the 9 packages individually and fix any new errors surfaced by `composite`'s stricter file-scoping checks
  - Fixed `packages/codemod` pipeline to pass `filePath` into each step (`Transform` is arity-2)
  - Added `"types": ["node"]` to `private/utils` so standalone `tsc` resolves Node globals (its local `@types` folder otherwise only exposed `@types/semver`)

## 4. Wire the reference graph

- [x] 4.1 Add `references` to the root `tsconfig.json` pointing at all 9 source-package tsconfigs
- [x] 4.2 Remove `packages/sku`, `packages/codemod`, `packages/create` from the root `tsconfig.json`'s `exclude`, if `references` supersedes the exclusion
  - Kept and expanded `exclude` to all 9 referenced packages so they are not typechecked twice by the root program
- [x] 4.3 Audit each package's actual `import` graph against its declared `references` to confirm no cross-package import is missing a reference
  - Added package-level `references` for: `sku` → vite/babel-plugin/codemod/create/pnpm-plugin/utils; `create` → utils/pnpm-plugin; `codemod` → vite; `inject-changelog-preamble` → utils; `react-lib-with-loadable` → vite

## 5. Switch `lint:tsc` to `tsc --build`

- [x] 5.1 Change the root `lint:tsc` script from `tsc` to `tsc --build`
- [x] 5.2 Decide whether `lint:tsc:sku` is still needed or superseded by `tsc --build`, and update or remove it accordingly
  - Removed root `lint:tsc:sku`; root `tsc --build` already covers `packages/sku` via references. Package-local `sku` `lint:tsc` remains.
- [x] 5.3 Run `pnpm lint:tsc` from scratch (no `.tsbuildinfo` files) and confirm the reported errors match a plain `tsc` baseline taken before this change
  - Cold `tsc --build` exits 0 with 0 `error TS` lines (baseline was also clean). Required switching referenced projects from `noEmit` to `emitDeclarationOnly` + `outDir: node_modules/.cache/tsc`.
- [x] 5.4 Make an isolated change to one package's source, re-run `pnpm lint:tsc`, and confirm the build log shows unrelated packages as up to date
  - Content change in `packages/vite`: vite rebuilt; unrelated packages stayed up to date (~1.4s vs ~4.8s cold)

## 6. Reconcile with the eslint resolver config

- [x] 6.1 Prefer consolidating onto one root references config: point the eslint resolver's `configFile` at the root `tsconfig.json` if that works, otherwise keep a thin renamed alias rather than a second parallel references list
- [x] 6.2 Delete or rename `tsconfig.eslint.json` accordingly (and update its knip ignore entry, if any)
  - Deleted `tsconfig.eslint.json`; no knip ignore entry existed
- [x] 6.3 Run `pnpm lint:eslint` and confirm no "Multiple projects found" warning appears and no new lint errors are reported
  - Clean run, no multi-project warning. Also restored `tsdown.config.ts` (and `package.json` where imported) in package includes so the project service still sees them after `rootDir` scoping.

## 7. Verify build output is unchanged

- [x] 7.1 Run `pnpm build` for each of the 9 source packages before and after the change and diff the output directories for byte-equivalence
  - `tsdown` builds succeeded for the 6 publishable packages; declaration emit stays under `node_modules/.cache/tsc` (no `tsbuildinfo` in `dist`). Private packages have no build script.

## 8. Benchmark after

- [x] 8.1 Repeat the from-scratch and single-package incremental timings with the same method as the baseline
  - After cold: **4.96s** real (covers all 9 packages, including sku). After incremental (vite content change): **0.79s** real
- [x] 8.2 Confirm the incremental run is meaningfully faster than the baseline; note whether from-scratch is roughly unchanged
  - Incremental **0.79s** vs baseline **2.55s** (~3× faster) while also typechecking sku in-graph. Cold **4.96s** vs baseline **3.30s** is expectedly higher because baseline root `tsc` excluded sku/codemod/create (sku alone was **4.94s**)

## 9. Docs and changelog

- [x] 9.1 Add a changeset describing the `lint:tsc` behavior change (internal tooling only, no consumer-facing impact)
