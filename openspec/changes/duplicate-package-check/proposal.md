## Why

When an app ends up with two copies of a library like React or Vanilla Extract, each copy keeps its own internal state. For React that shows up as invalid hook call errors, and for Vanilla Extract and the packages built on it, as broken or duplicated styles. sku used to warn about this with `validatePeerDeps`, but that check relies on the way npm and Yarn nest packages in `node_modules` and returns early under pnpm, so pnpm projects currently get no warning at all.

## What Changes

- Add a Vite plugin that warns when an app uses more than one copy of a checked package. It only warns and never fails the command.
- Check `react`, `react-dom`, `@vanilla-extract/css`, and every compile package. Compile packages are packages that sku builds as if they were part of the app, usually because they ship Vanilla Extract styles. They include `sku` and `braid-design-system` by default. The list is fixed, so there is no new config option.
- Count copies by package directory rather than version. pnpm can install the same version twice when the copies have different peer dependencies, and those are still two separate copies at runtime.
- `sku build` checks the modules that end up in the client bundle, so only code the app actually ships can trigger a warning. `sku start` can't see that until pages load, so it checks the app's resolved dependency tree once at startup instead.
- Fix a gap in SSR builds. sku bundles every package that uses `@vanilla-extract/css` into the server build instead of loading it from `node_modules` at runtime, which keeps server and client class names in sync (a mismatch can cause hydration errors). To find those packages, sku walks the app's dependency tree and records which packages depend on which. When the walk meets a second version of a package, it silently skips recording the package that pulled it in. If that package uses Vanilla Extract, it is left out of the server bundle. Because the walk runs in parallel, which version counts as "second" can change between runs. The walk will now record every copy, which also gives `sku start` the data it needs for its check.
- Remove `validatePeerDeps`, including its check that installed versions satisfy each package's peer dependency ranges.
- Remove the `skuSkipValidatePeerDeps` option from `package.json`. sku silently ignores the field if an app still sets it, and those apps get the new duplicate warnings like any other app.

## Non-goals

- Failing the build when duplicates are found.
- Removing duplicates automatically, for example with Vite's `resolve.dedupe`, which can hide real version incompatibilities.
- Checking peer dependency ranges, because pnpm already warns about unmet peers at install time.
- Checking every `@seek/*` package. Most are types, API clients, or server code, where a duplicate only costs bundle size, and warning about them could soon need an ignore option.
- Webpack support. The new check is a Vite plugin, so webpack projects no longer get a duplicate check. Most apps are running pnpm now anyway, so the new check is a better fit for them.

## Capabilities

### New Capabilities

- `duplicate-package-check`: Warn when a sku app uses more than one copy of a checked package.

### Modified Capabilities

- `ssr`: SSR builds bundle every package that uses `@vanilla-extract/css`, including packages that use a second copy of it.

## Impact

- A new plugin in `packages/sku/src/services/vite/plugins/`, registered in `skuPlugin`.
- Changes to `dependencyGraph.ts` and `setNoExternal.ts` for the SSR fix.
- Deletes `utils/validatePeerDeps.ts`, its six call sites, and the `peer_dep_version_mismatch` telemetry event, and removes `skuSkipValidatePeerDeps` from the root `package.json` and all fixtures.
- New docs for the check, and a minor changeset.
