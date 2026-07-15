## Why

Vite SSR is disabled today, and webpack SSR’s low-level `renderCallback` + string document + `#app` hydrate cannot stream Suspense HTML or let React own `<html>`/`<head>`/`<body>`. We need a Vite-only SSR mode with React Router Data Mode, full-document streaming, and modern CSP headers — shipped **experimental** (not for production).

## What Changes

- Vite-only SSR via `renderType: 'server-side-rendered' | 'static-generated'`. `sku start` / `sku build` run the lifecycle; `-ssr` commands and webpack + this renderType **error**.
- Required `serverEntry` / `clientEntry` named exports: both export `routes: RouteObject[]`; server also `onRequest` + `middleware`; client also `onHydrate` (hard error if file or export missing). Sku owns Document/HTML. Optional `AppWrapper` from `onRequest` / `onHydrate`. Production HTTP middleware = server-entry `middleware`; optional config `devServerMiddleware` for local mocks only. Dual `routes` must stay hydration-compatible (docs/template recommend `createRoutes`; no runtime checker).
- Full-document stream (`renderToPipeableStream`); hydrate at `document`. No `transformIndexHtml` on SSR responses. Relative `publicPath` only. React 19+ required (documented; no runtime gate).
- Shell-derived CSP as HTTP headers; lazy single request-scoped nonce; optional Report-Only.
- Vocab/language chunks via server `onRequest` `language`; auto-derive lazy-route `moduleId`; per-route chunk fixture.
- `@sku-lib/create` template `vite-ssr`; product + Migrating docs in `server-rendering.md`.
- Initial release is **experimental**: docs MUST warn not-for-production; changeset / release notes MUST state the same.

### Non-goals

- Webpack SSR backfill; webpack-SSR create template; converting static `vite` create template
- Migration pages under `docs/migration-guides/`; infra/deploy guides
- React Router Framework Mode / RSC; consumer Document override; absolute/`CDN` `publicPath`
- Production listen-logging parity; runtime validation that server/client route trees match

## Capabilities

### New Capabilities

- `vite-ssr`: Vite SSR lifecycle — `renderType`, dual-entry `routes` + request entries, streaming Document, chunks, create template, product + Migrating docs
- `vite-ssr-csp`: Shell-derived CSP headers, lazy single nonce, optional report-only

### Modified Capabilities

- (none — bundler/command constraints for this mode live under `vite-ssr`)

## Impact

- **Public API:** `renderType`; required entry named exports; ALS CSP nonce; server `language` for Document vocab only; `onHydrate({ context })`; create template `vite-ssr`; reused `devServerMiddleware`
- **Deps:** `react-router` (Data Mode); React 19+ prerequisite for this mode (peer may stay `^18 || ^19` for other modes)
- **Docs / release:** `server-rendering.md` (product + Migrating), `vite.md`, `csp.md`, `configuration.md`, create READMEs — dual `routes` / `createRoutes`, Express vs RR middleware, experimental warning; changeset marks experimental
- **Fixtures/tests:** Vite SSR fixture (streaming, CSP, entries, per-route chunks, vocab); create template tests
- **Opt-in / adopt:** via `renderType`; document hydrate (not `#app`); relative `publicPath` only; React 19+; required named exports
