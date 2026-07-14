## Why

Vite SSR is disabled today, and webpack SSR’s low-level `renderCallback` + string document + `#app` hydrate cannot stream Suspense HTML or let React own `<html>`/`<head>`/`<body>`. We need a Vite-only SSR mode with React Router Data Mode routes, full-document streaming, and modern CSP headers — without `transformIndexHtml` on the SSR response.

## What Changes

- Add a **Vite-only** SSR mode selected by sku config `renderType: 'server-side-rendered' | 'static-generated'` (not separate `-ssr` commands).
- With `renderType: 'server-side-rendered'`, `sku start` / `sku build` run the SSR lifecycle; `sku start-ssr` / `sku build-ssr` MUST error (use unsuffixed commands).
- `sku build` for Vite SSR emits sibling `client/` and `server/` directories under the build target (neither nested in the other).
- `bundler: 'webpack'` + `renderType: 'server-side-rendered'` MUST error (new SSR mode is Vite-only).
- High-level routes entry (named `routes: RouteObject[]` via `routesEntry`, default `src/routes.tsx`), not a port of webpack `serverEntry`/`renderCallback`. No `SkuApp` type — docs refer to exporting the route config from the routes entry. Missing `routes` is a **hard error**.
- **Required** separate server/client request entries via existing `serverEntry` / `clientEntry` (defaults `src/server.tsx` / `src/client.tsx`; path may be `.ts` / `.tsx` / `.js`) with **named exports** under Vite SSR: `onRequest` (closed return object: optional `AppWrapper`, `language`, JSON-serialisable `clientContext`), `middleware` (Connect `RequestHandler` or array, server entry only), and `onHydrate` (closed return object: optional `AppWrapper`). Sku mounts optional `AppWrapper` **inside** the React Router tree as a pathless parent layout (providers MAY use router context/hooks); separate server/client entries remain the composition seam for env-divergent providers and request/hydrate closure. Missing entry files or any of these named exports (`routes`, `onRequest`, `middleware`, `onHydrate`) MUST be a **hard error** — no sku noop stubs or soft-skip. Do not use `default`. Do not add parallel `entryServer` / `entryClient` keys. Sku still owns Document/HTML; these are not webpack `renderCallback`.
- sku owns request handling and a React document shell; stream with `renderToPipeableStream` (shell-first by default); hydrate at `document`, not `#app`.
- **No consumer Document override**: sku owns the Document; head/SEO uses React 19 metadata in routes/layouts (conformity over configuration; can revisit if a consumer need appears).
- Skip `transformIndexHtml` on SSR responses; supply Vite client / Refresh preamble / CSS / preloads via Document assets, `bootstrapModules`, and hashable bootstrap script content.
- Auto-generate CSP from shell HTML as **HTTP headers**, with optional request-scoped nonces (and bootstrap hashes), plus optional **Report-Only**. Relative `publicPath` only (`'self'`); absolute/`CDN` `publicPath` is **not** supported for Vite SSR.
- **Vite SSR `publicPath`:** relative paths only (e.g. `/` or `/static/`). Absolute `http(s):` / CDN `publicPath` MUST be rejected or unsupported for this mode (webpack SSR / static may keep existing absolute-path behavior).
- Production-safe hydration bootstrap (no `Error.stack` leak; promise-safe loader/action data) and a **single** request-scoped nonce helper for Vite SSR: mint only when explicitly requested, reuse that value everywhere, and put `'nonce-…'` in the CSP header only if requested (distinct from static/webpack `createUnsafeNonce`, which may create multiple nonces).
- Vite SSR **requires React 19+** (documented prerequisite; no runtime version gate).
- **Vocab/language async chunking** for Vite SSR (parity with static Vite `@vocab/vite` chunk helpers): when `languages` is configured, the active language chunk MUST be registered for Document assets / SSR + client load. Sku owns registration; apps identify the active language (configured language **name**, e.g. `th-TH`) **only** via server request entry `language`, with sole-language fallback and soft-fail when unresolved (no middleware `req.skuLanguage`, no `:language` param identity, no `handle.language`, no `addLanguageChunk` callback).
- A **fixture that demonstrates per-route async chunking** of routes (distinct lazy route modules → separate chunks on SSR + hydration), not only incidental lazy-route usage in the main fixture.
- Auto-derive lazy-route `handle.moduleId` from idiomatic `lazy: () => import('…')` via a Vite SSR AST transform (manual `moduleId` remains as escape hatch; non-idiomatic lazy shapes are skipped with the existing dev warning).
- Docs and release notes for the new public API (see Impact).

### Non-goals

- Backfill the new SSR mode to webpack (use existing `start-ssr` / `build-ssr` without `renderType: 'server-side-rendered'`)
- Changing static (SSG) apps beyond accepting `renderType: 'static-generated'` as the explicit static mode
- React Router Framework Mode / `@react-router/dev` as the bundler owner
- Preserving `flushHeadTags` / meta `http-equiv` CSP as the Vite SSR API
- Library-mode SSR / React Server Components
- Requiring static apps to migrate off `renderDocument` / `#app`
- Absolute / CDN `publicPath` for Vite SSR apps (relative public asset paths only)
- Exposing a consumer-swappable Document shell (sku-owned Document + React 19 head metadata instead; revisit only if required)
- Webpack-style `addLanguageChunk` / open-ended request-entry return objects / putting request handlers or middleware on the routes entry / introducing a `SkuApp` wrapper type
- Production listen / setup logging parity with webpack SSR, or accepting a custom logger for setup events (deferred — see `design.md` Open Questions)

## Capabilities

### New Capabilities

- `vite-ssr`: Vite SSR lifecycle — `renderType` selection, routes entry, full-document streaming render, no `transformIndexHtml` on the SSR path, route-level chunks, vocab/language chunks, document hydration, command validation, and a fixture demonstrating per-route chunking
- `vite-ssr-csp`: CSP for Vite SSR — shell-derived header policies, request-scoped nonce only when requested, hashes, optional report-only

### Modified Capabilities

- `bundler`: Vite + `renderType: 'server-side-rendered'` uses `sku start` / `sku build`; reject webpack for that renderType; reject `-ssr` commands when `renderType` is set (message no longer “SSR is only supported with Webpack”)

## Impact

- **Public API**: `renderType` config; Vite SSR `routesEntry` exporting named `routes` (`RouteObject[]`, no `SkuApp`); required server/client request entries via reused `serverEntry` / `clientEntry` with named `onRequest` / `middleware` / `onHydrate` under Vite SSR (hard error if any entry or export is missing); request-scoped CSP nonce surface for Vite SSR (single value, only when requested); server entry `language` as the only app-owned vocab identity path; webpack SSR without the new renderType unchanged
- **Deps**: `react-router` (Data Mode) as a sku-managed dependency for Vite SSR; Vite SSR requires **React 19+** (sku peer may remain `^18 || ^19` for static/webpack consumers); `@vocab/vite` language chunks remain required when `languages` is configured
- **Docs (create/update in `docs/docs/`):**
  - `server-rendering.md` — Vite SSR vs webpack SSR; required routes entry (`routes` export); required named request-entry exports via `serverEntry` / `clientEntry` (`onRequest` / `middleware` / `onHydrate`); document hydrate; **React 19+ required**; vocab chunks (server entry `language` + sole-language fallback) / lazy route chunks; auto-derived `moduleId` for idiomatic `lazy` imports; customizing error pages via React Router `ErrorBoundary` (link to RR docs + short data-mode example)
  - `vite.md` — Vite SSR via `renderType`, commands, required routes + request-entry exports, streaming/hydrate differences vs static; **React 19+ required**; vocab/language chunks + per-route chunking pattern; auto-derived `moduleId`
  - `csp.md` — Vite SSR header CSP; single request-scoped nonce only when requested; report-only; relative `publicPath` only
  - `configuration.md` — `renderType`, `routesEntry`; document mode-discriminated required `serverEntry` / `clientEntry` for Vite SSR (named exports; no `entryServer` / `entryClient`); fix stale `.js` defaults to `.tsx` and note `.ts` works; CSP report-only options; Vite SSR `publicPath` constraint; **`renderType` docs note React 19+**
- **Fixtures/tests:** Vite SSR fixture must demonstrate per-route async chunking; default `src/routes.tsx` / `src/server.tsx` / `src/client.tsx` without path overrides; middleware on server entry; vocab language chunk registration via server entry `language` when `languages` is used; post-review coverage for loader/action headers, HTTPS `sku start`, document hydration, and errored-route status
- **Release notes:** changeset MUST describe the public API, MUST state that **Vite SSR requires React 19+**, and MUST link/reference each of the docs above
- **Breaking risk**: Opt-in via `renderType`; streaming apps use document hydrate (not string `renderDocument` / `#app`); Vite SSR does **not** support absolute/`CDN` `publicPath` (relative only); Vite SSR requires **React 19+**; Vite SSR requires `serverEntry` / `clientEntry` with named `onRequest` / `middleware` / `onHydrate` (hard error if missing — no sku noops); Vite SSR language identity is via server entry only (not middleware `req.skuLanguage` / `:language`)
- **Also:** Vite SSR forwards RR loader/action headers on HTML responses; `httpsDevServer` is supported on the single-port Vite SSR dev server; Vite SSR middleware is the server entry’s named `middleware` export (not on the routes entry, not config `devServerMiddleware`)
