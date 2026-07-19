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
  - Product + Migrating docs in `server-rendering.md` (single-port, deploy layout, CJS interop, Express typing, named `Component`, move off `public`).
- CJS interop: document start-vs-build failure mode + `__UNSAFE_EXPERIMENTAL__cjsInteropDependencies`.
  - **No** expanded baked-in interop defaults beyond Apollo; no runtime error rewriting.
- Config JSDoc must not claim Vite is static-only.
  - Express `@types` aligned with Vite SSR runtime major.
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
- **Deps:** `react-router` (Data Mode)
- **Docs / release:**
  - `server-rendering.md` (product + Migrating), `vite.md`, `csp.md`, `configuration.md`, create READMEs
  - Topics: dual `routes` / `createRoutes`, named `Component`, single-port/`PORT`, deploy layout, CJS interop, Express major, Express vs RR middleware, experimental warning, move off config `public` / public assets folder (import assets instead)
  - Changeset marks experimental; accurate `bundler` JSDoc
- **Fixtures/tests:**
  - Vite SSR fixture (streaming, CSP, entries, per-route chunks, vocab; relative `/static/...` `publicPath` with app routes outside that prefix)
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
