## Why

Vite SSR is disabled today.

Webpack SSR’s low-level `renderCallback` + string document + `#app` hydrate cannot stream Suspense HTML or let React own `<html>`/`<head>`/`<body>`.

We need a Vite-only SSR mode with React Router Data Mode, full-document streaming, and modern CSP headers — shipped **experimental** (not for production).

## What Changes

- Vite-only SSR via `buildType: 'ssr' | 'static'`.
  - `sku start` / `sku build` run the lifecycle.
  - `-ssr` commands and webpack + this buildType **error**.
- Required `serverEntry` / `clientEntry` named exports:
  - both export `routes: RouteObject[]`
  - server also `onRequest` + `middleware`
  - client also `onHydrate` (hard error if required named export missing)
  - Sku owns Document/HTML
  - Optional `AppWrapper` from `onRequest` / `onHydrate`
  - Production HTTP middleware = server-entry `middleware`
  - Optional config `devServerMiddleware` for local mocks only
  - Dual `routes` must stay hydration-compatible (docs/template recommend `createRoutes`; no runtime checker)
- Full-document stream (`renderToPipeableStream`); hydrate at `document`.
  - No `transformIndexHtml` on SSR responses.
  - Relative `publicPath` only — **asset base only**; MUST NOT become React Router `basename` (no first-class basename config).
- Shell-derived CSP as HTTP headers; lazy single request-scoped nonce; optional Report-Only.
  - Production bakes CSP/port via webpack-aligned defines (`__SKU_CSP__`, `__SKU_DEFAULT_SERVER_PORT__` from `port`) — no sidecar, no parallel `SKU_*` env knobs.
  - Vite SSR is single-port: only `port` (plus runtime `PORT`); `serverPort` is rejected.
- Vocab/language chunks only when server `onRequest` returns `language` (optional; no allowlist / sole-language default).
  - Auto-derive lazy-route `moduleId`; per-route chunk fixture.
- `@sku-lib/create` template `vite-ssr` with named `Component` on lazy pages.
  - Product + Migrating docs in `server-rendering.md` (single-port, deploy layout, CJS interop, Express 5, React Router 8, named `Component`, move off `public`).
- Trial-migration Migrating docs follow-ups (Older SSR):
  - Reminder: Keep server-only modules out of common render code. Server/client specific content should be accessed through AppWrapper injected Provider context.
  - Prefer render-time React data loading (AppWrapper + Suspense / shared clients); use loaders for waterfalls, document redirects, or response headers — not as the default for page content
  - Do **not** bridge Express `req` / middleware-attached state into React Router loaders; apps that need that stay on webpack SSR and raise with sku-support
  - Braid: reset must run before any Braid-touching server module on `sku start` (evaluation order can differ from production build); no auto-inject of Braid reset into sku’s server entry (Braid is optional)
  - Reminder: providers that touch `window` must not run in the SSR tree (client-only / `onHydrate`-only wrappers)
  - Jest → Vitest is a Vite SSR prerequisite; Migrating points at existing Vitest docs / checklist (no new Jest→Vitest codemod in this change)
  - Vocab on Vite SSR: sku resolves `@vocab/vite` from its install and aliases bare `@vocab/vite…` imports (including injected `.vocab` imports) onto that path; drop “install `@vocab/vite` yourself” docs once proven
  - Path aliases: webpack `baseUrl` / bare `src/…` → `#src/…` via `pathAliases` (point at existing migrate-root-resolution guidance)
- CJS interop: document start-vs-build failure mode + `__UNSAFE_EXPERIMENTAL__cjsInteropDependencies`.
  - **No** expanded baked-in interop defaults beyond Apollo; no runtime error rewriting.
- Config JSDoc must not claim Vite is static-only.
- Vite SSR ships on **Express 5** and **React Router 8** before release.
  - Align Express `@types` with Express 5; document Express 5 for middleware typing.
  - Document React Router 8 for Data Mode / route typing consumers rely on.
  - **BREAKING** (policy for later releases): bumping the Express or React Router major that Vite SSR integrates may be a breaking change — consumer `middleware` / `devServerMiddleware` mount into sku’s Express app, and consumer routes/entries use React Router Data Mode APIs.
- Vite SSR MUST NOT support config `public` (copied-as-is public assets folder).
  - Hard-error if that directory exists on `sku start` / `sku build`.
  - Docs discourage the pattern and point to importing assets instead; Migrating covers moving off it.
- Initial release is **experimental**:
  - Docs MUST warn not-for-production.
  - Changeset / release notes MUST state the same.

### Non-goals

- Webpack SSR backfill; webpack-SSR create template; converting static `vite` create template
- Migration pages under `docs/migration-guides/`; full infra/deploy product guides (Migrating still covers entry path + layout)
- React Router Framework Mode / RSC; consumer Document override; absolute/`CDN` `publicPath`; first-class router-basename config
- Vite SSR `serverPort` (webpack-only dual-port leftover)
- Expanding sku’s default CJS interop dependency list beyond Apollo
- Production listen-logging parity; runtime validation that server/client route trees match
- Supporting (or soft-deprecating without hard error) the `public` assets folder for Vite SSR until there is a definitive need
- Automatic client bundler strip for `*.server.ts` (docs / consumer convention only)
- Auto-injecting `braid-design-system/reset` into sku’s Vite SSR server entry
- A new Jest→Vitest codemod beyond what `@sku-lib/codemod` / Vitest docs already cover
- Bridging Express `req` (or middleware-attached state) into React Router loaders
- Shipping RR `requestContext` / `getLoadContext` seeding (deferred)

## Capabilities

### New Capabilities

- `vite-ssr`: Vite SSR lifecycle — `buildType`, dual-entry `routes` + request entries, streaming Document, chunks, create template, product + Migrating docs
- `vite-ssr-csp`: Shell-derived CSP headers, lazy single nonce, optional report-only

### Modified Capabilities

- (none — bundler/command constraints for this mode live under `vite-ssr`)

## Impact

- **Public API:**
  - `buildType`
  - Single `port` for Vite SSR (start + baked prod default; reject `serverPort`)
  - Required entry named exports
  - ALS CSP nonce
  - Server `language` for Document vocab only
  - `onHydrate({ context })`
  - Create template `vite-ssr`
  - Reused `devServerMiddleware`
- **Deps:** `react-router` 8 (Data Mode); Express 5 (Vite SSR server runtime + `@types`)
- **Docs / release:**
  - `server-rendering.md` (product + Migrating), `vite.md`, `csp.md`, `configuration.md`, create READMEs
  - Topics: dual `routes` / `createRoutes`, named `Component`, single-port/`PORT`, deploy layout, CJS interop, Express 5, React Router 8, Express vs RR middleware, experimental warning, move off config `public` / public assets folder (import assets instead), prefer render-time data loading (AppWrapper + Suspense); loaders for waterfalls / document redirects / headers; no Express→loader bridge, server-only loaders vs client route graph, Braid reset-before-Braid on start, client-only providers in Document SSR, Jest→Vitest prerequisite, sku-owned `@vocab/vite` resolve/alias for language chunks (no consumer pin), `#` pathAliases
  - Future Express / React Router major upgrades may be breaking (middleware + Data Mode integration)
  - Changeset marks experimental; accurate `bundler` JSDoc
- **Fixtures/tests:**
  - Vite SSR fixture (streaming, CSP, entries, per-route chunks, vocab; relative `/static/...` `publicPath` with app routes outside that prefix)
  - Translations fixture: Vite SSR adapters alongside existing static / webpack SSR coverage (`en` / `fr` / `en-PSEUDO`)
  - Create template tests (named `Component`)
  - Config edge cases (webpack + `ssr`, `-ssr` with `buildType`, absolute/`CDN` `publicPath`, Vite SSR + `serverPort`, Vite SSR + existing `public` directory) stay config/command validation only — no browser e2e for those
- **Opt-in / adopt:**
  - Via `buildType`
  - Document hydrate (not `#app`)
  - Relative asset-only `publicPath`
  - No `public` assets folder (directory must not exist)
  - Required named exports
  - Shared `__sku_alias__*` entry aliases with static Vite
  - Production defines aligned with webpack SSR naming/shape where they overlap (`port` → `__SKU_DEFAULT_SERVER_PORT__`)
