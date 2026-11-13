## Context

sku has two separate pieces today:

- `validatePeerDeps` warns about duplicate compile packages and duplicate `@vanilla-extract/css` during start, build, and serve. It reads the folder layout that npm and yarn use, so it returns early with pnpm.
- The Vite service has a dependency graph walk, `extractDependencyGraph`. It resolves packages the way Node does, so it works with pnpm too. It records only package names, and sku uses it only to calculate SSR `noExternal` entries.

Duplicate versions of the four watched packages cause real failures. Hooks and context break, rendering uses mismatched versions, compile packages break, and Vanilla Extract adapter state splits across copies. `sku lint` runs in CI and works with both bundlers, so it is a better place for these warnings than start and build.

## Goals / Non-Goals

**Goals:**

- One check that works with pnpm, npm, yarn, Vite, and webpack.
- Warnings that tell the developer what to fix: each version, its folder, the dependency chain to each copy, and a `why` command to run.

**Non-Goals:**

- Failing lint or a build. The check always returns exit code 0. If it needs more attention later, sku can show a more visible banner.
- Proving that a copy is in the output bundle, for example with a Vite plugin or module graph analysis. We defer this unless lint telemetry shows too many false warnings.
- Walking `optionalDependencies` (see Known limitation).

## Decisions

### 1. Run the check in `sku lint` and only warn

The check is an entry in the `checks` list in `lint.action.ts`. A `skip` flag on `LintCheck` stops it when lint gets path arguments, such as `sku lint src/foo.ts`. The check prints problems in a warning banner, counts them in telemetry, and always returns `exitCode: 0`.

Duplicates change only when dependencies change, and developers run lint at that time. A failing check would block unrelated work because of transitive duplicates that the app sometimes cannot fix, so we rejected hard errors.

We also considered these options:

- A Vite plugin that inspects output chunks. It is accurate, but it works only for builds. In dev, it would depend on the dependency optimizer and HMR invalidation.
- `pnpm-lock-buddy`, `@christiango/vite-plugin-duplicate-packages`, and `unplugin-detect-duplicated-deps`. None of them gives a short watchlist, warn-only lint output, and support for all package managers. Each would also add an immature or CLI-only dependency.

### 2. Find problems from the dependency graph

`dependencyGraph.ts` moves from `services/vite/helpers/config/` to `utils/`, because its users no longer depend on a bundler. Each `DepGraphEntry` gets `version` and `peerDependencies`. The walk already reads each `package.json`, so this adds no I/O. The `ROOT` entry has no version, so the classifier ignores it.

To find a package folder, the walk searches Node's `node_modules` lookup paths for `<dep>/package.json` and uses its real path. The old code resolved `<dep>/package.json` as a module. That fails when a package's `exports` field leaves out `package.json`, and it silently dropped about 13% of sku's own dependency graph. The real path gives each pnpm store copy its own key.

Each time package A resolves package B, the walk adds A to B's `dependents`. So the copy of peer P that a package resolves is the P entry whose `dependents` include that package's folder. The graph needs no other record of resolutions.

A pure function, the classifier, groups copies of checked packages by name and finds three kinds of problem:

- Duplicate versions: a checked package resolves at two or more versions. Copies in different folders at the same version (pnpm peer variants) are not reported.
- Peer version mismatch: the classifier compares each peer dependency between checked packages with the copy that it resolves, one copy at a time. The fix advice depends on whether the resolved version is above or below the range. The classifier skips ranges that are not semver, such as `workspace:*`, and counts a prerelease inside a range as a match (`includePrerelease`). The legacy check merged copies with the same name, and it fired only when both packages were already duplicated.
- React pair mismatch: `react-dom` must load a `react` at its own exact version, whatever its declared range says. The classifier compares each `react-dom` copy with the `react` copy that it resolves, so an unrelated duplicate `react` does not cause a pair warning. That duplicate gets its own warning.

Unit tests can call the classifier without a file system.

### 3. Checked packages: a watchlist plus compile packages

The watchlist is a constant in the check module: `react`, `react-dom`, `braid-design-system`, and `@vanilla-extract/css`. `lint.action.ts` passes the app's compile packages from `skuContext.paths.compilePackages()` as `extraPackages`. These are the `@seek` packages flagged `skuCompilePackage`, sku's defaults (`sku` and `braid-design-system`), and the app's `compilePackages` config.

This is the same list that sku uses to decide what to compile. If sku does not find a flagged package, it does not compile it either, so the graph does not record the flag.

### 4. Reporting, telemetry, and opt-out

Each warning shows the package, each version and its folder, one dependency chain per copy (for example `your app > lib-a > react`), and the `why` command for the package manager. `getWhyCommand()` returns `pnpm why -r` with pnpm. The wording says "resolved in your dependency graph", not "in your bundle". Telemetry counts problems with the legacy `duplicate_compile_package` and `peer_dep_version_mismatch` events.

The check reads `skuSkipValidatePeerDeps` from the root `package.json` itself. The flag keeps its name and meaning without the legacy code.

### 5. Remove `validatePeerDeps`

Remove `utils/validatePeerDeps.ts`, its wrapper in `utils/configure.ts`, and its calls in start, the Vite and webpack build handlers, build-ssr, serve, and webpack start-ssr. The lint check keeps both legacy behaviours, duplicate compile packages and peer range warnings, and adds pnpm support and per-copy peer checks. Webpack apps still get the check through lint.

### 6. Walk root `devDependencies` for the lint check

The walk starts from the root `dependencies` and follows each package's `dependencies` and `peerDependencies`. The lint check passes `includeDevDependencies`, so the walk also starts from the root `devDependencies`. `sku init` installs `@vanilla-extract/css` as a devDependency. Without this option, lint misses a version mismatch between the app's copy and the copy that braid resolves. `setNoExternal` still walks `dependencies` only.

### Known limitation

The walk does not follow `optionalDependencies`. Packages that are reachable only through them are not in the graph, so neither `setNoExternal` nor this check sees them. A comment at the start of the walk says this.

## Risks / Trade-offs

- A package in the graph is not always in the bundle, so some warnings name copies that tree-shaking or externalisation would remove. → The checked list is short, the check ignores copies at the same version, and the wording does not mention the bundle. Telemetry runs during the warn-only period.
- Compile packages add `@seek` libraries with old duplicates or loose peer ranges. → Lint only warns, and a peer warning appears only when the resolved copy is out of range. The opt-out flag works, and telemetry shows how often each package has problems.
- With pnpm, a symlink path would merge different copies into one graph key. → The walk uses real paths. A symlink fixture test covers this.
- Walking `devDependencies` also walks sku's own `@vanilla-extract/css`, which comes through `@vanilla-extract/integration`. Lint reports it when its version differs from the app's. → It is a real second copy, and the legacy check reported it too. It is less risky than an app and braid mismatch, because the integration binds the CSS adapter inside each evaluated file. The adapter uses the copy that the file resolves.
- The walk fix adds Vite `noExternal` entries for packages that hide `package.json`. → The list only grows, and each new entry really depends on `@vanilla-extract/css`. A patch changeset covers this.
- Teams that seldom run lint stop seeing duplicate warnings. → We accept this. Lint is a required CI check in the target workflow.
- Apps with old duplicates get new warnings when they upgrade sku. → The check only warns, the opt-out flag works, and the changeset describes the change.
- The check can run without `node_modules`. → The walk logs packages that it cannot resolve to the debug log and leaves them out, so lint reports nothing. Any other error prints a failed-check message. The check still returns `exitCode: 0`.

## Migration Plan

1. Ship without a flag. In one minor release, lint gets the warning and start and build lose the legacy warnings.
2. Use telemetry to decide whether sku needs a more visible banner. The check still never fails.
3. To roll back, revert the change. Consumers do not need to change anything.

## Open Questions

None block this change. Lint never closes the telemetry provider, but the build handlers do. Check whether `@seek/sku-telemetry` buffers counts before relying on lint telemetry.
