## Why

Vite SSR is disabled today.

Webpack SSR’s low-level `renderCallback` + string document + `#app` hydrate cannot stream Suspense HTML.

It also cannot let React own `<html>`/`<head>`/`<body>`.

This change adds a Vite-only SSR mode with React Router Data Mode, full-document streaming, and modern CSP headers.

It ships **experimental** (not for production).

## What Changes

- Vite-only SSR via `buildType: 'ssr' | 'static'`.
  - `sku start` / `sku build` run the lifecycle.
  - `-ssr` commands error when `buildType` is set.
  - Webpack + this buildType errors.
- Required `serverEntry` / `clientEntry` named exports:
  - Both export `routes: RouteObject[]`.
  - Server also exports `onRequest` + `middleware`.
  - Client also exports `onHydrate`.
  - Missing required named exports hard-error.
  - Sku owns Document/HTML.
  - Optional `AppWrapper` from `onRequest` / `onHydrate`.
  - Production HTTP middleware is server-entry `middleware`.
  - Optional config `devServerMiddleware` is for local mocks only.
  - Dual `routes` must stay hydration-compatible.
  - Docs/template recommend `createRoutes`; no runtime checker.
- Full-document stream (`renderToPipeableStream`).
- Hydrate at `document`.
- Vite SSR browser client imports `virtual:sku/polyfills` (config `polyfills` parity with static Vite / webpack SSR).
- No `transformIndexHtml` on SSR responses.
- Vite SSR `sku start` mounts SSR-CSS: virtual stylesheet via Document `assets.css`
- Vite SSR `sku start` telemetry parity with static (`start.initial` / `start.rebuild`); client scripts via client entry / bootstrap; mark `initialPageLoad` when the SSR dev server is ready.
- Relative `publicPath` only — **asset base only**.
- `publicPath` MUST NOT become React Router `basename`.
- No first-class router-basename config.
- Shell-derived CSP as HTTP headers.
- Lazy single request-scoped nonce.
- Optional Report-Only CSP.
- Production bakes CSP/port via webpack-aligned defines (`__SKU_CSP__`, `__SKU_DEFAULT_SERVER_PORT__` from `port`).
- No sidecar runtime manifest.
- No parallel `SKU_*` env knobs.
- Vite SSR is single-port: only `port` (plus runtime `PORT`).
- `serverPort` is rejected.
- Vocab/language chunks only when server `onRequest` returns `language`.
- Language is optional; no allowlist / sole-language default.
- Auto-derive lazy-route `moduleId`.
- Per-route chunk fixture.
- Sku resolves `@vocab/vite` from its install.
- Sku aliases bare `@vocab/vite…` imports (including injected `.vocab` imports).
- Consumers do not need a direct `@vocab/vite` dep.
- `@sku-lib/create` template `vite-ssr` with named `Component` on lazy pages.
- Product + Migrating docs in `server-rendering.md`.
- Migrating covers single-port and deploy layout.
- Migrating covers CJS interop, Express 4 (shared sku major), React Router 8, named `Component`, and moving off `public`.
- Prefer AppWrapper + Suspense for page content.
- Keep server-only modules off the client route graph.
- Use loaders for waterfalls, document redirects, or response headers.
- No Express `req` → loader bridge.
- Apps that need that stay on webpack SSR or raise with sku-support.
- Braid reset-before-Braid on `sku start` (no sku auto-inject).
- `window`-touching providers are client-only / `onHydrate`-only.
- Jest → Vitest is a Vite SSR prerequisite.
- Bare `src/…` imports move to `#` pathAliases.
- CJS interop: document the start-vs-build failure mode.
- Document `__UNSAFE_EXPERIMENTAL__cjsInteropDependencies`.
- **No** expanded baked-in interop defaults beyond Apollo.
- No runtime error rewriting for CJS interop.
- Config JSDoc must not claim Vite is static-only.
- Vite SSR ships on **Express 4** (same sku `express` / `@types` major as webpack SSR) and **React Router 8** (optional peerDependency `^8`).
- Do **not** upgrade Express 4 → 5 in this change — that would break webpack SSR and other shared Express surfaces.
- Document Express 4 for middleware typing (`middleware` / `SkuSsrMiddleware`).
- Document React Router 8 for Data Mode / route typing.
- `react-router` is an **optional peerDependency** `^8` (not a hard sku dependency).
- Vite SSR template/fixtures install React Router 8; webpack/static apps are unaffected.
- This change MUST NOT ship Jest transforms for `react-router` / `cookie-es` / `import.meta` (Vite SSR requires Vitest; RR8+Jest for webpack is out of scope).
- **BREAKING** (policy for later releases): bumping the Express or React Router major that Vite SSR integrates may be a breaking change.
- Consumer middleware mounts into sku’s Express app.
- Consumer routes/entries use React Router Data Mode APIs.
- Express 5 is deferred to a later sku-wide breaking change.
- Vite SSR MUST NOT support config `public` (copied-as-is public assets folder).
- Hard-error if that directory exists on `sku start` / `sku build`.
- Docs discourage the pattern and point to importing assets instead.
- Initial release is **experimental**.
- Docs MUST warn not-for-production.
- Changeset / release notes MUST state the same.
- Vite SSR MUST NOT support `dangerouslySetViteConfig`.

### Non-goals

- Webpack SSR backfill or updating Webpack-SSR create template.
- Converting the static `vite` create template.
- Full infra/deploy product guides (Keep sku's existing scope).
- React Router Framework Mode or React Server Components (RSC).
- Consumer Document override.
- Absolute/`CDN` `publicPath`.
- First-class router-basename config.
- Vite SSR `serverPort` (webpack-only dual-port leftover).
- Expanding sku’s default CJS interop dependency list beyond Apollo.
- Production listen-logging parity.
- Runtime validation that server/client route trees match.
- Supporting the `public` assets folder for Vite SSR until there is a definitive need.
- Automatic client bundler strip for `*.server.ts` (docs / consumer convention only).
- Auto-injecting `braid-design-system/reset` into sku’s Vite SSR server entry.
- A new Jest→Vitest codemod beyond what `@sku-lib/codemod` / Vitest docs already cover.
- Bridging Express `req` (or middleware-attached state) into React Router loaders.
- Shipping RR `requestContext` / `getLoadContext` seeding (deferred).
- Upgrading sku’s shared Express dependency from 4 → 5 (deferred; would break webpack SSR).
- Shipping Jest support for React Router 8 (transforms / ESM interop).
- Forcing webpack fixtures or non–Vite-SSR apps onto React Router 8.
- Supporting `@sku-lib/vite/loadable` Collector / `preloadPlugin` module-id preloading as a Vite SSR Document asset source (static Vite / prerender only; Vite SSR uses React Router `lazy` + `handle.moduleId`).
- Supporting `dangerouslySetViteConfig` for Vite SSR.

## Capabilities

### New Capabilities

- `vite-ssr`: Vite SSR lifecycle — `buildType`, dual-entry `routes` + request entries, streaming Document, chunks, create template, product + Migrating docs.
- `vite-ssr-csp`: Shell-derived CSP headers, lazy single nonce, optional report-only.

### Modified Capabilities

- (none — bundler/command constraints for this mode live under `vite-ssr`)

## Impact

- **Public API:**
  - `buildType`
  - Single `port` (`serverPort` not supported)
  - Required entry named exports
  - ALS CSP nonce
  - Server `language` for Document vocab only
  - `onHydrate({ context })`
  - Create template `vite-ssr`
  - Reused `devServerMiddleware`
- **Deps:**
  - `react-router` 8 as optional peerDependency `^8` (Data Mode; required for Vite SSR consumers)
  - Express 4 (shared sku server runtime + `@types`; same major as webpack SSR — no 4 → 5 bump)
- **Docs / release:**
  - `server-rendering.md` (product + Migrating)
  - `vite.md`, `csp.md`, `configuration.md`, create READMEs
  - Experimental warning
  - Changeset
  - Future Express / React Router majors may be breaking
  - Express 5 deferred to a later sku-wide breaking change
- **Fixtures/tests:**
  - Vite SSR fixture (streaming, CSP, entries, per-route chunks, vocab, relative `/static/...` `publicPath`)
  - Translations fixture Vite SSR adapters (`en` / `fr` / `en-PSEUDO`)
  - Create template tests
  - Config edge cases stay validation-only (no browser e2e)
- **Opt-in / adopt:**
  - Via `buildType`
  - Document hydrate (not `#app`)
  - Relative asset-only `publicPath`
  - No `public` assets folder
  - No `dangerouslySetViteConfig`
  - Required named exports
  - Shared `__sku_alias__*` entry aliases
  - Production defines aligned with webpack SSR naming where they overlap
