# Design

## Context

The SSR build environment sets `resolve.noExternal` to `compilePackages` plus packages that depend on `@vanilla-extract/css` (`setNoExternalPlugin`).
Vite externalises everything else, so the server output imports `react`, `react-router`, `react-dom/server` and `express` at runtime.
This plugin applies to `sku start` and `sku build`.

Facts that make full bundling cheap here:

- Rolldown already emits a `createRequire(import.meta.url)` shim in `server.js` for CommonJS `require` of built-ins.
- `config.ts` bakes `process.env.NODE_ENV` at build time, so bundled React uses its production build.
- `startProductionSsrServer` finds the manifest with `import.meta.url` relative to `server/`, so it keeps working if chunks stay in `server/`.
- SSR rejects `dangerouslySetViteConfig` and `vitePlugins`, so sku controls the whole SSR plugin graph.

## Goals / Non-Goals

**Goals:**

- One bundler pass, owned by sku, decides what ships in `server/`.

**Non-Goals:**

- Changing dev-server module resolution or CJS interop under `sku start`.
- Bundle size work beyond what Rolldown already does.

## Decisions

### Bundle everything in `sku build` only

In the SSR build environment, set `resolve.noExternal: true`. For the Node target, Vite keeps built-ins external.
Vite merges `true` over the shared `noExternal` list, so the current `compilePackages` and vanilla-extract list still applies to `sku start`, where externals keep startup fast and avoid re-transforming `node_modules`.

Alternatives considered:

- **Externals plus a pruned `server/node_modules`** (Next.js `output: 'standalone'`, Nitro): trace the externals with `@vercel/nft` and copy real files. It is more robust for packages that resist bundling, but adds a tracing dependency, pnpm symlink handling and a second layout contract. It also ships native binaries for the build machine's platform, not `linux/arm64`. We'll keep it as the fallback mechanism if the exceptions list ever needs it.
- **Ask apps to add dependencies to `compilePackages`**: this changes how those packages compile, and every app would have to keep the list up to date.
- **Let deploy tools re-bundle `dist/server`** (the consumer's esbuild workaround): this is a second resolver that depends on sku's file names.

### Clear explicit SSR externals in the build

After `noExternal: true`, a package stays external only if it is a built-in or listed in `ssr.external`.
Explicit externals win over `noExternal: true`, and merged config can only add to the list.
sku's own `ssr.external: ['vite']` and `@vanilla-extract/vite-plugin`'s `ssr.external: ['@vanilla-extract/css', …]` both land there, so Braid apps kept importing `@vanilla-extract/css/recipe` at runtime.
The SSR build plugin clears the SSR environment's `resolve.external` in `configEnvironment`, after all `config` hooks have run.
vanilla-extract only needs `@vanilla-extract/css` external for `sku start`, where `.css.ts` files are evaluated at runtime; the build already compiles them away.

### Dedupe React singletons

With externals, Node resolved `react`, `react-dom` and `react-router` from `server/`, so the app and sku's runtime always shared one copy.
Bundling resolves from each importer's real path, so a linked sku, a monorepo or a peer mismatch can bundle two copies and break hooks (`Cannot read properties of null (reading 'useContext')`).
The SSR build sets `resolve.dedupe` for those three packages so they resolve from the app root.

### Test the output instead of guarding it

Consumers can't add externals, so leftovers only come from sku's config or from plugins sku mounts.
Browser tests that start `server/` from an isolated copy (`ssr-data`, and Braid for vanilla-extract) catch that in CI. They also catch runtime failures that an import scan can't see.
If sku ever ships a non-built-in external, add a build-time check then.

### No exceptions list yet

sku ships with no non-built-in externals.
If a package can't be bundled, sku-support adds a fix to sku (a resolve alias, a plugin, or an external plus the `server/node_modules` copy step above).
Consumers do not get an option for this, which matches the SSR escape-hatch policy.

## Risks / Trade-offs

- [A dependency resolves files relative to its own location at runtime (`__dirname`, `require.resolve`, `fs.readFile` of package assets), so bundling breaks it] → Smoke-test a production-like Managed Data Mode app (Apollo, Braid, Vocab, a pino-based logger, auth middleware) from an isolated copy before release. Fix each failure in sku.
- [pino transports use worker threads and need extra files when bundled] → pino without transports logs to stdout and bundles fine. A transport configured by an app is a known exception that gets documented.
- [APM agents that patch `require`, such as `dd-trace`, can't instrument bundled packages] → Out of scope. The deploy tool owns agent preload (`--import`), and the docs say bundled packages are not auto-instrumented.
- [A larger server bundle and a slower `sku build`] → This is acceptable for a deploy artifact. Inline sourcemaps grow with it; we'll measure the size on the smoke-test app.
- [Node runs `server.js` as ESM only through module syntax detection; a parent `package.json` with `"type": "commonjs"` would break it] → Deploy tools put `server/` in its own directory. Emit `server/package.json` if a consumer hits this.

## Migration Plan

This does not need a migration for consumers.
Deploys that copy `node_modules` keep working and can drop that step after upgrading.
To roll back, revert the release. The output layout is otherwise unchanged.
