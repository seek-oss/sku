## Why

Vite SSR is disabled today.

Webpack SSR’s low-level `renderCallback` + string document + `#app` hydrate cannot stream Suspense HTML.

It also cannot let React own `<html>`/`<head>`/`<body>`.

This change adds a Vite-only SSR mode with React Router Data Mode, full-document streaming, and modern CSP headers.

It ships **experimental** (not for production).

Multi-site apps need different React Router path sets per site (e.g. site-only pages).
A single unfiltered `RouteObject[]` either over-matches unsupported paths or registers foreign paths on every host.
Vite SSR makes site-scoped trees first-class — the same way multi-language is first-class — via a first-class `routesEntry` that exports flat `routes` with optional `sites` membership, sku pre-building per-site trees from config site names, and the app exporting sync `getSite({ req })` (config `hosts` are local-dev only and must not drive production site selection).

With Express `req` on named getters / optional `getContext`, apps have no need to separate server vs client route modules.
A single `routesEntry` is the source of truth for both graphs.

Streaming data transports — Apollo Client’s streaming hydration above all — must inject `<script>` chunks between React’s stream chunks so queries run during SSR hydrate the browser cache instead of refetching.
Sku owns `renderToPipeableStream` and the response pipe, so an app cannot reach the stream; this is the same reason `Providers` exists for wrapping outside the router.
Apollo integration is a critical adoption requirement for sku, so sku opens that one seam and leaves the transport itself to the app.

## What Changes

- Vite-only SSR via `buildType: 'ssr' | 'static'` (experimental): `sku start` / `sku build`; not webpack style `-ssr`.
- First-class config `routesEntry` (default `src/routes.tsx`) plus request entries (`serverEntry` / `clientEntry`).
  Sku loads `routesEntry` into both server and client graphs via `__sku_alias__routesEntry`.
  The module MUST export named `routes: SkuSsrRouteObject[]` (flat array).
  `SkuSsrRouteObject = RouteObject & { sites?: string[] }` (sku type helper only — not a wrapped RR re-export).
  Omit `sites` ⇒ route is on every config site; present `sites` ⇒ include only for those names.
  No parent→child `sites` inheritance (site splits must be explicit).
  Sku pre-builds per-site trees from config site names, strips `sites` before RR APIs, selects by resolved `site`, serializes `site` into the hydrate bootstrap, and fails closed on invalid/unknown `site`.
  Vite SSR requires a non-empty config `sites` array (≥1 site name).
  Single configured site ⇒ sku uses that name when `getSite` is omitted; multi-site ⇒ missing `getSite` hard-errors at init.
  Apps own site resolution and per-site path _shape_; sku owns membership filtering and hydration alignment.
  Config `routes` (static prerender path lists) remains a separate concept — do not overload it.
- Request-entry contract: sync named getters `getSite` / `getLanguage` / `getClientContext` (`{ req }` only); optional `middleware` and `onHydrate`; optional dual-entry `Providers` and `getContext`.
  Sku owns Document, streaming, assets, and CSP headers.
- Optional named `Providers` on `serverEntry` / `clientEntry` is rendered **outside** the router (`Document` → `Providers` → router), so each environment can inject its own dependencies (client-only SDKs, server-only clients).
  Sku passes `site` and the request `clientContext` as props, and never wraps the route tree — so each site’s `createStaticHandler` is built once at init and nothing per request touches the tree.
  Router-aware, isomorphic providers belong in the app’s own root layout route in `routesEntry` — plain React Router, no sku API.
- `useInsertHtml()` on the existing browser-safe `sku/ssr` subpath (alongside `usePreloadRoute`) so app-owned streaming data transports can insert HTML into the response stream.
  Sku collects the returned nodes during SSR and flushes them between React stream chunks (and at stream end), before hydration.
  It is a no-op wherever there is no sku SSR render around it — the client graph and the dev `Providers` markup probe included — and MUST NOT throw.
  Apps own the transport (e.g. `@apollo/client-react-streaming`’s `buildManualDataTransport`) and pass sku’s `getCspNonce()` onto the scripts they inject, since post-shell script bodies cannot be hashed into the CSP header.
- Getters receive Express `req` so site / language / `clientContext` can read middleware-attached state (logger, auth, hostname, etc.).
  Request-scoped values reach the tree as `Providers` props, not by returning a component from entry exports.
- Optional dual-entry `getContext` exports (server + client) seed React Router `RouterContextProvider` for loader/action DI on document SSR and client navigations.
- Docs: prefer render-time data loading + Suspense for page content, with dependencies injected via `Providers`; Apollo streaming hydration as the worked end-to-end example (`useInsertHtml`, nonce on injected scripts, cache reuse across hydration, and why loader-transported query refs are not the path); router-aware providers in the app’s root layout route; request-scoped values via `Providers` props (`site` / `clientContext`) or `getContext`; document `getContext` as opt-in; red warning against putting Express `req` (or other non-isomorphic platform objects) into router context; multi-site routing via `routesEntry` + flat `routes` + optional `sites` + `getSite` (not `routesBySite` maps, optional path params, union tree + allowlist, or sku host matching as the product story).
- Create template `vite-ssr` plus product and Migrating docs (config, fixtures, entries, routing).
- Shared Express 4 server runtime; React Router 8 as an optional peerDependency `^8` for Vite SSR consumers.
- Policy for later releases: bumping the Express or React Router major that Vite SSR integrates may be a breaking change.

Out of scope for this change (details in `design.md`): webpack SSR / create-template backfill, static `vite` template conversion, Framework Mode / RSC, Express 5, absolute/`CDN` `publicPath`, first-class router basename, Vite SSR `serverPort`, config `public` assets folder, `dangerouslySetViteConfig`, Jest support for React Router 8, making Express `req` the loader `request` argument, shipping Framework Mode server-only `getLoadContext(req, res)` as the sole API, passing Fetch `Request` / `res` into getters, treating raw Express `req` in `RouterContextProvider` as a supported pattern, sku-owned wrapping of the route tree (provider mounting as a pathless layout route), sku-owned site resolution from config `hosts`/`sites[].host`, sku reading site/language from a conventional `req` field or push API, a combined site+language+context return bag, async getters, tolerating a missing entry file, sku-owned per-site path expansion libraries, per-site JS bundles, returning routes from getters, dual-entry `routes` re-exports, `routesBySite` maps, parent→child inheritance of `sites`, a sku-owned Apollo dependency / provider / config, `@apollo/client-integration-react-router`’s loader transport (`apolloLoader` / `preloadQuery` query refs in loader data), streaming (turbo-stream) loader-data serialization, and two-pass `getDataFromTree` SSR.

## Capabilities

### New Capabilities

- `vite-ssr`: Vite SSR lifecycle — `buildType`, `routesEntry` + flat `routes` + optional `sites` + request entries, `getSite` tree selection, streaming Document, chunks, create template, product + Migrating docs.
- `vite-ssr-csp`: Shell-derived CSP headers, lazy single nonce, optional report-only.

### Modified Capabilities

- (none — bundler/command constraints for this mode live under `vite-ssr`)

## Impact

- **Public API:** `buildType`; `routesEntry` (default `src/routes.tsx`); single `port` (no `serverPort`); non-empty config `sites` for Vite SSR; `routesEntry` named export `routes`; `SkuSsrRouteObject` type helper (`sites?`); sync getters `getSite` / `getLanguage` / `getClientContext` (`{ req }` only; `getSite` required when config has >1 site); optional `middleware` / `onHydrate`; ALS CSP nonce; server `language` for Document vocab; optional dual-entry named `Providers` (outside the router; `site` + `clientContext` props); optional server/client `getContext` → RR `requestContext` / `createBrowserRouter({ getContext })`; create template `vite-ssr`; reused `devServerMiddleware`; `usePreloadRoute` and `useInsertHtml` on a new `sku/ssr` subpath, for intent route preloading and for app-owned streaming data transports respectively.
- **Deps:** `react-router` optional peer `^8`; Express 4 shared with webpack SSR (no 4 → 5 bump).
- **Docs / release:** Product + Migrating docs (incl. `routesEntry`, multi-site flat `routes` + `sites` + `getSite`, named getters, `Providers` vs root layout route); related config/CSP/Vite docs; data-loading hierarchy + red warning against `req` in context; Data Mode dual `getContext` patterns (including client-nav ≠ initial SSR location); Apollo streaming hydration walkthrough (`useInsertHtml`, nonce on injected scripts, cache reuse across hydration); experimental warning + changeset; Express 5 deferred.
- **Fixtures/tests:** Vite SSR fixture (streaming, CSP, entries, chunks, vocab, relative `publicPath`, multi-site `sites` + `getSite`); a `stream-insert-html` fixture proving Apollo streaming hydration end to end (server-run queries not refetched on hydrate; post-hydration queries still fetch); translations adapters; create template tests; config edge cases validation-only.
- **Adopt:** Opt-in via `buildType`; document hydrate; relative asset-only `publicPath`; no `public` folder / `dangerouslySetViteConfig`; shared `__sku_alias__*` entries (incl. `routesEntry`); webpack-aligned production defines where they overlap.
