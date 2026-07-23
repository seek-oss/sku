## Context

`eslint-tsconfig-references` added `tsconfig.eslint.json`, used only by the eslint import resolver, with `references` to the 9 real source packages. It left every per-package tsconfig, the root `tsconfig.json`, and `lint:tsc` (plain `tsc`) untouched.

Of the 9 packages, `packages/sku`, `packages/vite`, and `packages/pnpm-plugin` have no explicit `rootDir`, which `composite: true` requires. The other 6 already declare one. None of the 9 reference each other via TypeScript `references` today, so `tsc` recompiles all of them on every run with no cross-package incremental cache.

## Goals / Non-Goals

**Goals:**

- Make `lint:tsc` incremental via `tsc --build`, so unrelated packages are skipped when only one package changes.
- Give every source package `composite: true` and an explicit `rootDir`.
- Prefer a single root references config shared by `lint:tsc` and the eslint import resolver when that is workable, including by deleting or renaming `tsconfig.eslint.json` if consolidation is cleaner than keeping a parallel file.
- Keep `tsdown` build output unchanged; these settings are `tsc`-only.

**Non-Goals:**

- Changing any package's runtime behavior, public API, or bundling.

## Decisions

### Make all 9 source packages composite

Add `composite: true` to each package's `tsconfig.json`, and add an explicit `rootDir: "./src"` to the 3 that lack one (`packages/sku`, `packages/vite`, `packages/pnpm-plugin`), matching the other 6.

### Root `tsconfig.json` references all 9 packages

Add `references` to the root config for all 9 packages, replacing its current `exclude` of 3 of them. Referencing all 9 (not just the excluded 3) avoids the other 6 being typechecked twice, once directly and once via their own reference.

### `lint:tsc` becomes `tsc --build`

`tsc --build` reads the root config's `references` and skips packages whose `.tsbuildinfo` shows no relevant change. `lint:tsc:sku`'s separate `tsc --noEmit` invocation should be revisited once `packages/sku` is composite, since `--build` may supersede it.

### Prefer one root references config for `tsc` and eslint

Once the root `tsconfig.json` has real `references`, point the eslint resolver at that same config and remove `tsconfig.eslint.json` if nothing else depends on it. If the root config cannot serve both tools as-is, keep a dedicated eslint entrypoint only as a thin alias or rename, not as a second parallel references list.

## Risks / Trade-offs

- `composite: true` may surface previously-hidden typecheck errors in packages not cleanly scoped to `rootDir`. Fix these as source changes, not by loosening `composite`.
- `tsc --build`'s `.tsbuildinfo` cache can go stale if deleted inconsistently across CI cache layers; make sure a from-scratch (no-cache) run still passes.
- If package A imports package B's types but B is missing from A's `references`, `tsc --build` may typecheck A against stale declarations. Audit each package's import graph against its `references` before relying on incremental skips.
- Rollback touches 10 tsconfig files and one script; land as a single, easily revertible change.

## Open Questions

- Whether the root `tsconfig.json` can be the eslint resolver's `configFile` directly, or whether a renamed thin wrapper is still needed for eslint-only options.
- Whether `lint:tsc:sku` should be replaced by `tsc --build packages/sku` or removed once the root `--build` covers it.
- Whether `tsconfig.build.json` files also need `composite: true`, or whether it should be confined to the typecheck-only `tsconfig.json`.
