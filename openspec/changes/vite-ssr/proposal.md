## Why

Vite SSR is disabled today.

Webpack SSR’s low-level `renderCallback` + string document + `#app` hydrate cannot stream Suspense HTML.

It also cannot let React own `<html>`/`<head>`/`<body>`.

This change adds a Vite-only SSR mode with React Router Data Mode, full-document streaming, and modern CSP headers.

It ships **experimental** (not for production).

Multi-site apps need different React Router path sets per site (e.g. site-only pages).
A single unfiltered `RouteObject[]` either over-matches unsupported paths or registers foreign paths on every host.
Vite SSR makes site-scoped trees first-class — the same way multi-language is first-class — via a first-class `routesEntry` that exports flat `routes` with optional `sites` membership, sku pre-building per-site trees from config site names, and the app returning `site` from `onRequest` (config `hosts` are local-dev only and must not drive production site selection).

With Express `req` on `onRequest` / optional `getContext`, apps have no need to separate server vs client route modules.
A single `routesEntry` is the source of truth for both graphs.

## What Changes

- Vite-only SSR via `buildType: 'ssr' | 'static'` (experimental): `sku start` / `sku build`; not webpack style `-ssr`.
- First-class config `routesEntry` (default `src/routes.tsx`) plus request entries (`serverEntry` / `clientEntry`).
  Sku loads `routesEntry` into both server and client graphs via `__sku_alias__routesEntry`.
  The module MUST export named `routes: SkuSsrRouteObject[]` (flat array).
  `SkuSsrRouteObject = RouteObject & { sites?: string[] }` (sku type helper only — not a wrapped RR re-export).
  Omit `sites` ⇒ route is on every config site; present `sites` ⇒ include only for those names.
  No parent→child `sites` inheritance (site splits must be explicit).
  Sku pre-builds per-site trees from config site names, strips `sites` before RR APIs, selects by `onRequest.site`, serializes `site` into the hydrate bootstrap, and fails closed on missing/invalid/unknown `site`.
  Vite SSR requires a non-empty config `sites` array (≥1 site name).
  Apps own site resolution and per-site path _shape_; sku owns membership filtering and hydration alignment.
  Config `routes` (static prerender path lists) remains a separate concept — do not overload it.
- Request-entry contract: server `onRequest` / `middleware`; client `onHydrate`; optional dual-entry `AppWrapper` and `getContext` named exports.
  Sku owns Document, streaming, assets, and CSP headers.
- Optional named `AppWrapper` on `serverEntry` / `clientEntry` is a **stable** provider component (may differ per environment).
  Sku mounts it as a pathless layout under the router and pre-builds `createStaticHandler` per site with that wrapper — not on the per-request hot path.
- `onRequest` receives Express `req` so site selection / `language` / `clientContext` can read middleware-attached state (logger, auth, hostname, etc.).
  Request-scoped provider values are not created by returning a new component type from `onRequest` / `onHydrate`.
- Optional dual-entry `getContext` exports (server + client) seed React Router `RouterContextProvider` for loader/action DI on document SSR and client navigations.
- Docs: prefer stable `AppWrapper` + Suspense for page content; request-scoped clients via re-derive / ALS-style helpers / `clientContext` / `getContext`; document `getContext` as opt-in; red warning against putting Express `req` (or other non-isomorphic platform objects) into router context; multi-site routing via `routesEntry` + flat `routes` + optional `sites` + `onRequest.site` (not `routesBySite` maps, optional path params, union tree + allowlist, or sku host matching as the product story).
- Create template `vite-ssr` plus product and Migrating docs (config, fixtures, entries, routing).
- Shared Express 4 server runtime; React Router 8 as an optional peerDependency `^8` for Vite SSR consumers.
- Policy for later releases: bumping the Express or React Router major that Vite SSR integrates may be a breaking change.

Out of scope for this change (details in `design.md`): webpack SSR / create-template backfill, static `vite` template conversion, Framework Mode / RSC, Express 5, absolute/`CDN` `publicPath`, first-class router basename, Vite SSR `serverPort`, config `public` assets folder, `dangerouslySetViteConfig`, Jest support for React Router 8, making Express `req` the loader `request` argument, shipping Framework Mode server-only `getLoadContext(req, res)` as the sole API, passing Fetch `Request` into `onRequest`, passing `res` into `onRequest` / `getContext`, treating raw Express `req` in `RouterContextProvider` as a supported pattern, sku-owned site resolution from config `hosts`/`sites[].host`, sku-owned per-site path expansion libraries, per-site JS bundles, returning routes from `onRequest`, dual-entry `routes` re-exports, `routesBySite` maps, and parent→child inheritance of `sites`.

## Capabilities

### New Capabilities

- `vite-ssr`: Vite SSR lifecycle — `buildType`, `routesEntry` + flat `routes` + optional `sites` + request entries, `onRequest.site` tree selection, streaming Document, chunks, create template, product + Migrating docs.
- `vite-ssr-csp`: Shell-derived CSP headers, lazy single nonce, optional report-only.

### Modified Capabilities

- (none — bundler/command constraints for this mode live under `vite-ssr`)

## Impact

- **Public API:** `buildType`; `routesEntry` (default `src/routes.tsx`); single `port` (no `serverPort`); non-empty config `sites` for Vite SSR; `routesEntry` named export `routes`; `SkuSsrRouteObject` type helper (`sites?`); required `onRequest` return field `site`; ALS CSP nonce; server `language` for Document vocab; `onRequest({ req })` (Express only); `onHydrate({ context })`; optional dual-entry named `AppWrapper`; optional server/client `getContext` → RR `requestContext` / `createBrowserRouter({ getContext })`; create template `vite-ssr`; reused `devServerMiddleware`.
- **Deps:** `react-router` optional peer `^8`; Express 4 shared with webpack SSR (no 4 → 5 bump).
- **Docs / release:** Product + Migrating docs (incl. `routesEntry`, multi-site flat `routes` + `sites` + `onRequest.site`, stable `AppWrapper`); related config/CSP/Vite docs; data-loading hierarchy + red warning against `req` in context; Data Mode dual `getContext` patterns (including client-nav ≠ initial SSR location); experimental warning + changeset; Express 5 deferred.
- **Fixtures/tests:** Vite SSR fixture (streaming, CSP, entries, chunks, vocab, relative `publicPath`, multi-site `sites` + `onRequest.site`); translations adapters; create template tests; config edge cases validation-only.
- **Adopt:** Opt-in via `buildType`; document hydrate; relative asset-only `publicPath`; no `public` folder / `dangerouslySetViteConfig`; shared `__sku_alias__*` entries (incl. `routesEntry`); webpack-aligned production defines where they overlap.
