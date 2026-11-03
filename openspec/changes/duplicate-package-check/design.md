## Context

The old check, `validatePeerDeps`, finds duplicates by crawling `node_modules` for nested `node_modules/<name>` directories, which is where npm and Yarn put a second copy of a package. pnpm stores every package in a virtual store under `node_modules/.pnpm` and links them together with symlinks, so that layout doesn't exist and the check returns early for pnpm projects.

sku also has a separate dependency walker, `dependencyGraph.ts`. It stores one entry per package name, along with the packages that depend on it. SSR builds start from `@vanilla-extract/css` and follow those "depended on by" links upward to find every package to bundle into the server build.

When the walker reaches a second version of a package, it throws before recording the package that pulled that version in. The parent call catches the error and only logs it under `DEBUG=sku:dependency-graph`. The link from that dependent is lost, and neither the dependent nor anything that reaches Vanilla Extract only through it is bundled. The walk also runs in parallel, so whichever version's `package.json` is read first gets recorded, and the lost link can change from one run to the next.

For example:

```
app ──► braid-design-system ──► @vanilla-extract/css 1.21   (recorded first)
 └────► some-chart-lib ───────► @vanilla-extract/css 1.20   (throws, link lost)
```

Here `some-chart-lib` is left external, so Node loads it from `node_modules` at runtime without sku's Vanilla Extract processing and with its own module instances. That can fail at import, or render different markup or class names on the server than on the client, which shows up as hydration errors. Compile packages such as braid are always bundled, so the bug only affects other packages on a path to Vanilla Extract.

## Decisions

### A copy is a package directory, not a version

Vite resolves symlinks, so every module ID it sees is a real file path, for example `node_modules/.pnpm/react@19.2.8/node_modules/react/index.js`. The plugin treats everything up to and including `node_modules/<name>` as the package directory (two path segments for scoped names like `@vanilla-extract/css`), and reads the version from the `package.json` in that directory.

Duplicates are grouped by directory rather than by version number. pnpm can install the same version of a package twice when the copies have different peer dependencies, and each directory is loaded as a separate module with its own state. A version-only comparison would miss that case.

### `sku build` reads the client bundle's output chunks

In the `generateBundle` hook, the plugin collects the module IDs from each output chunk in the client environment. Chunks only contain code that actually ships, so a copy that tree-shaking removed won't trigger a warning. We chose this over `this.getModuleIds()`, which lists every module Vite loaded, including ones that were later tree-shaken away.

The plugin only runs in the client environment. Every checked package is browser code, so if there is a duplicate it will show up in the client bundle. The server bundle is a poor source anyway, because it leaves most packages external and they never enter its module graph.

### `sku start` walks the dependency tree

The dev server can't use the same approach, for two reasons. Vite only loads a module when a page requests it, so at any point the module graph only covers pages that have been visited. And dependencies that Vite pre-bundles appear under `node_modules/.vite/deps` rather than at their real paths. Instead, `sku start` walks the app's dependency tree once when it starts.

The walk begins at the app's own `package.json`, not the workspace root, so in a monorepo it doesn't pick up packages that only other apps use. The trade-off is that a static walk can report a copy the app never imports. Because the checked packages are client UI libraries, we expect this to be rare.

### One dependency graph that records every copy

`dependencyGraph.ts` is changed to record every copy of a package, with its directory, version, and the packages that depend on it, instead of throwing on the second version. This gives both users of the walk what they need: `sku start` reads duplicates from it, and `setNoExternal` bundles the dependents of every `@vanilla-extract/css` copy, which fixes the lost-link bug described in Context. The result is cached so each process walks the tree only once.

### No config option

The checked list is `react`, `react-dom`, `@vanilla-extract/css`, plus the app's compile packages from `skuContext.paths.compilePackages()`. Compile packages are packages that ship Vanilla Extract styles or build on braid, so a second copy is likely to cause CSS bugs. That covers the cases where duplicates break things.

We decided not to check every `@seek/*` package. Many of them are types, API clients, or server code, where a duplicate costs bundle size at worst. App teams also often can't fix these duplicates themselves, because they come from other packages' dependencies. Warning about them would push us into adding an ignore option, which is the kind of config we want to avoid.

### Reporting

For each duplicate package, the plugin prints one `caution` banner that lists every copy with its version and directory, and suggests the package manager's `why` command (from `getWhyCommand()`) to trace where each copy comes from. It also sends one `duplicate_compile_package` telemetry event, the same event the old check used.

A build can run several Vite environments, so the plugin keeps a module-scope set of packages it has already reported and skips repeats. The plugin must also stay out of `vanillaExtractCompilerPluginAllowlist`. Plugins on that list are loaded into the Vanilla Extract compiler's child Vite server, which would report every duplicate a second time.

## Risks / Trade-offs

- The dependency walk can be slow on large dependency trees → Run it after the dev server starts listening, so it doesn't delay startup.
- Teams may see duplicates that come from their dependencies' dependencies, which they can't fix quickly and can't silence → The check only warns and never fails the build. The warning suggests `pnpm why`, and `pnpm dedupe` or pnpm `overrides` resolve most cases.
- Removing `skuSkipValidatePeerDeps` from the fixtures means any fixture with a real duplicate will start printing warnings, which can break tests that assert on output → Fix the duplicate in the fixture rather than hiding the warning.
