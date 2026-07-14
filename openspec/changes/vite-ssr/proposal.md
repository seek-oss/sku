## Why

Vite SSR is disabled today, and webpack SSR’s low-level `renderCallback` + string document + `#app` hydrate cannot stream Suspense HTML or let React own `<html>`/`<head>`/`<body>`. We need a Vite-only SSR mode with React Router Data Mode, full-document streaming, and modern CSP headers.

## What Changes

- Add Vite-only SSR via `renderType: 'server-side-rendered' | 'static-generated'` (not `-ssr` commands). `sku start` / `sku build` run the SSR lifecycle; `-ssr` commands and webpack + this renderType **error**.
- Routes entry (`routesEntry`, default `src/routes.tsx`) exporting named `routes: RouteObject[]`. Required server/client entries via `serverEntry` / `clientEntry` with named `onRequest`, `middleware`, `onHydrate` (hard error if missing). No `SkuApp`; sku owns Document/HTML. Production middleware = server-entry `middleware`. Optional config `devServerMiddleware` for Vite SSR local mocks only (dev graph; never in the production server bundle).
- Full-document stream (`renderToPipeableStream`); hydrate at `document`. No `transformIndexHtml` on SSR responses. Relative `publicPath` only.
- Shell-derived CSP as HTTP headers; lazy single request-scoped nonce; optional Report-Only.
- Vocab/language chunks via server entry `language`; auto-derive lazy-route `moduleId`; per-route chunk fixture.
- **React 19+** required (documented; no runtime gate).
- `@sku-lib/create` template `vite-ssr`; fleshed-out Vite SSR docs + Migrating sections in `server-rendering.md`.

### Non-goals

- Backfill to webpack; webpack-SSR create template; converting static `vite` create template
- Migration pages under `docs/migration-guides/`; infra/deploy guides
- React Router Framework Mode / RSC; consumer Document override; absolute/`CDN` `publicPath`
- Production listen-logging parity with webpack SSR

## Capabilities

### New Capabilities

- `vite-ssr`: Vite SSR lifecycle — `renderType`, routes + request entries, streaming Document, chunks, create template, product + Migrating docs
- `vite-ssr-csp`: Shell-derived CSP headers, lazy single nonce, optional report-only

### Modified Capabilities

- `bundler`: Vite + `renderType: 'server-side-rendered'` uses `sku start` / `sku build`; reject webpack for that renderType; reject `-ssr` when `renderType` is set

## Impact

- **Public API:** `renderType`; `routesEntry` + required `serverEntry` / `clientEntry` named exports; request-scoped CSP nonce; server `language` for vocab; create template `vite-ssr`; Vite SSR reuses config `devServerMiddleware` for optional local mocks
- **Deps:** `react-router` (Data Mode) for Vite SSR; React 19+ prerequisite (peer may stay `^18 || ^19` for other modes)
- **Docs:** `server-rendering.md` (product + Migrating), `vite.md`, `csp.md`, `configuration.md`, create READMEs
- **Fixtures/tests:** Vite SSR fixture (streaming, CSP, entries, per-route chunks, vocab); create template tests
- **Breaking risk:** Opt-in via `renderType`; document hydrate (not `#app`); relative `publicPath` only; React 19+; required named exports
