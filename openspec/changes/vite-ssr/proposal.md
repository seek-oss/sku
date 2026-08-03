## Why

SSR is disabled today.

Webpack SSR’s low-level `renderCallback` + string document + `#app` hydrate cannot stream Suspense HTML.

It also cannot let React own `<html>`/`<head>`/`<body>`.

This change introduces **Managed Data Mode**: sku owns Document, streaming/hydration, the Node server, and CSP, and wires React Router Data Mode for routing/data. Apps own routes, data, and providers.

Managed Data Mode is first shipped as **SSR** (`buildType: 'ssr'`). The same contract — `sku/runtime`, request entries, typed context hooks — is intended to be shared later by a new Static path. Render strategy (`ssr` / `static`) and the Managed Data Mode API are separate concerns.

It ships **experimental** (not for production).

Multi-site apps need different React Router path sets per site (e.g. site-only pages).
A single unfiltered `RouteObject[]` either over-matches unsupported paths or registers foreign paths on every host.
SSR makes site-scoped trees first-class — the same way multi-language is first-class — via a first-class `routesEntry` that exports flat `routes` with optional `sites` membership, sku pre-building per-site trees from resolved site names (empty config `sites` soft-defaults to `'default'`), and the app exporting sync `getSite({ req })` when multi-site (config `hosts` are local-dev only and must not drive production site selection).

With Express `req` on entry getters / optional `getRouterContext`, apps have no need to separate server vs client route modules.
A single `routesEntry` is the source of truth for both graphs.

Streaming data transports — Apollo Client’s streaming hydration above all — must inject `<script>` chunks between React’s stream chunks so queries run during SSR hydrate the browser cache instead of refetching.
Sku owns `renderToPipeableStream` and the response pipe, so an app cannot reach the stream; this is the same reason sku owns the request-scoped value seam (`SkuProvider` + entry getters) rather than letting apps wrap the Document render.
Apollo integration is a critical adoption requirement for sku, so sku opens that one seam and leaves the transport itself to the app.

Pass-through app `Providers` that only re-piped `site` / `clientContext` into React context proved awkward in fixtures.
Sku always mounts `SkuProvider` and exposes typed hooks via `createSkuContexts<typeof server, typeof client>()`; env-differing values (e.g. `apiClient` / Apollo `makeClient`) come from dual-entry `getReactContext`; isomorphic provider mounts (Apollo, Vocab) live in the app’s root layout route.

## What Changes

- SSR via `buildType: 'ssr' | 'static'` (experimental): `sku start` / `sku build`; not webpack style `-ssr`.
- First-class config `routesEntry` (default `src/routes.tsx`) plus request entries (`serverEntry` / `clientEntry`).
  Sku loads `routesEntry` into both server and client graphs via `__sku_alias__routesEntry`.
  The module MUST export named `routes: SkuRouteObject[]` (flat array).
  `SkuRouteObject = RouteObject & { sites?: string[] }` (sku type helper only — not a wrapped RR re-export).
  Omit `sites` ⇒ route is on every resolved site; present `sites` ⇒ include only for those names.
  No parent→child `sites` inheritance (site splits must be explicit).
  Sku pre-builds per-site trees from resolved site names, strips `sites` before RR APIs, selects by resolved `site`, serializes `site` into the hydrate bootstrap, and fails closed on invalid/unknown `site`.
  Empty or omitted config `sites` soft-defaults to a single synthetic site name `'default'` (not a hard error).
  Zero or one resolved site ⇒ sku uses that name when `getSite` is omitted; multi-site ⇒ missing `getSite` hard-errors at init.
  Apps own site resolution and per-site path _shape_; sku owns membership filtering and hydration alignment.
  Config `routes` (static prerender path lists) remains a separate concept — do not overload it.
- Request-entry contract: `serverEntry` / `clientEntry` each **`export default`** an object from `defineServerEntry` / `defineClientEntry` (zero-runtime inference helpers; structural types `SkuServerEntry` / `SkuClientEntry`).
  Optional sync getters on that object: `getSite` / `getLanguage` / `getClientContext` / `getReactContext`; optional `middleware` / `onListen` / `onHydrate` / dual-entry `getRouterContext`.
  Later getters receive already-resolved sibling values (`site` → `clientContext` → `reactContext`); `defineServerEntry` infers `Site` / `Language` / `ClientContext` / `ReactContext` from getter returns (`NoInfer` on sibling input positions); `defineClientEntry<typeof server>` extracts `Site` / `ClientContext` from the server entry (client callbacks cannot infer those — they only appear as inputs) and infers `ReactContext` from client `getReactContext`.
  Sku owns Document, streaming, assets, CSP headers, and an always-on `SkuProvider` outside the router (`Document` → `SkuProvider` → router).
- Optional server-entry `onListen({ app, httpServer, port })` — called once after middleware + HTML are mounted and `listen` succeeds (webpack `onStart` window; start + production). Await if async; failure fails startup; not re-fired on server-entry HMR. No `onBeforeListen`; no sku-owned listen logging by default.
- Opt-in config `expressTrustProxy` (boolean): when `true`, sku sets `app.set('trust proxy', 1)`; omit/false leaves Express default. Create template sets `expressTrustProxy: true`. Other trust-proxy values override in `onListen`.
- No app-authored dual-entry `Providers` / `SkuProvidersProps`.
  Three value channels instead:
  - `getClientContext` — JSON-serialisable isomorphic React seed → hydrate bootstrap + `useClientContext()`
  - dual-entry `getReactContext` — values that may differ on server vs client (MAY be non-JSON, e.g. `apiClient` / `makeClient`) → `useReactContext()`
  - dual-entry `getRouterContext` — values for React Router loaders/actions via `RouterContextProvider`
    Typed hooks via `createSkuContexts<typeof server, typeof client>()` on `sku/runtime` — extracts `Site` from `getSite` (fallback `string` when omitted), plus `ClientContext` / `ReactContext` from the entry objects (no required hand-written aliases; no per-property `defineGet*`). `useSite()` is that `Site` union. Language return type is inferred on the server entry only — no `useLanguage` / language-on-provider in v1.
    Router-aware / isomorphic wrapping (Vocab, Apollo provider mount, chrome) belongs in the app’s own root layout route — reads sku hooks; plain React Router otherwise.
    Sku never wraps the route tree — each site’s `createStaticHandler` is built once at init.
- `useInsertHtml()` on the existing browser-safe `sku/runtime` subpath (alongside `usePreloadRoute` and `createSkuContexts`) so app-owned streaming data transports can insert HTML into the response stream.
  Sku collects the returned nodes during SSR and flushes them between React stream chunks (and at stream end), before hydration.
  It is a no-op wherever there is no sku SSR render around it — including the client graph — and MUST NOT throw.
  Apps own the transport (e.g. `@apollo/client-react-streaming`’s `buildManualDataTransport`); dual-entry `getReactContext` supplies `makeClient` / server `extraScriptProps` (nonce via `getCspNonce()`); the isomorphic Apollo provider mounts in the root layout via `useReactContext()`.
- Getters that need the middleware bag receive Express `req` (`getSite` / `getLanguage` / `getClientContext`; server `getReactContext` / `getRouterContext` also get siblings).
  Request-scoped values reach the tree through `SkuProvider` + hooks, not by returning a component from entry exports.
- Docs: describe the architecture as **Managed Data Mode**; use **SSR** only for the render strategy; prefer render-time data loading + Suspense for page content, with clients from `useReactContext` / `useClientContext`; diagram the three channels (Markdown table — VitePress has no built-in Mermaid); Apollo streaming hydration as the worked end-to-end example; router-aware providers in the app’s root layout route; document `getRouterContext` as opt-in; red warning against putting Express `req` (or other non-isomorphic platform objects) into router context; multi-site routing via `routesEntry` + flat `routes` + optional `sites` + `getSite` (not `routesBySite` maps, optional path params, union tree + allowlist, or sku host matching as the product story).
- Create template `ssr` plus product and Migrating docs (config, fixtures, entries, routing).
- Shared Express 4 server runtime; React Router 8 as an optional peerDependency `^8` for SSR consumers.
- Policy for later releases: bumping the Express or React Router major that SSR integrates may be a breaking change.

Out of scope for this change (details in `design.md`): webpack SSR / create-template backfill, static `vite` template conversion, Framework Mode / RSC, Express 5, absolute/`CDN` `publicPath`, first-class router basename, SSR `serverPort`, config `public` assets folder, `dangerouslySetViteConfig`, Jest support for React Router 8, making Express `req` the loader `request` argument, shipping Framework Mode server-only `getLoadContext(req, res)` as the sole API, passing Fetch `Request` / `res` into early getters, treating raw Express `req` in `RouterContextProvider` as a supported pattern, app-authored dual-entry `Providers`, a public `useInitialLanguage` hook, sku-owned wrapping of the route tree (provider mounting as a pathless layout route), sku-owned site resolution from config `hosts`/`sites[].host`, sku reading site/language from a conventional `req` field or push API, an `onRequest`-style combined value return bag, per-getter named exports / per-property `defineGet*` helpers on request entries, async getters (except optional async `getRouterContext`), tolerating a missing entry file, sku-owned per-site path expansion libraries, per-site JS bundles, returning routes from getters, dual-entry `routes` re-exports, `routesBySite` maps, parent→child inheritance of `sites`, sku-owned listen logging / `onBeforeListen`, soft-defaulting Express `trust proxy` without config, a sku-owned Apollo dependency / provider / config, `@apollo/client-integration-react-router`’s loader transport (`apolloLoader` / `preloadQuery` query refs in loader data), streaming (turbo-stream) loader-data serialization, and two-pass `getDataFromTree` SSR.

## Capabilities

### New Capabilities

- `vite-ssr`: Managed Data Mode SSR lifecycle — `buildType`, `routesEntry` + flat `routes` + optional `sites` + request entries, `getSite` tree selection, `onListen`, `expressTrustProxy`, streaming Document, chunks, create template `ssr`, `sku/runtime`, product + Migrating docs.
- `vite-ssr-csp`: Shell-derived CSP headers, lazy single nonce, optional report-only.

### Modified Capabilities

- (none — bundler/command constraints for this mode live under `vite-ssr`)

## Impact

- **Public API:** `buildType`; `routesEntry` (default `src/routes.tsx`); single `port` (no `serverPort`); optional config `sites` for SSR (empty/omitted soft-defaults to `'default'`); optional `expressTrustProxy` (boolean → Express hop count `1`); `routesEntry` named export `routes`; `SkuRouteObject` type helper (`sites?`); default-exported request-entry objects via `defineServerEntry` / `defineClientEntry` (`SkuServerEntry` / `SkuClientEntry`); optional getters `getSite` / `getLanguage` / `getClientContext` / `getReactContext` (sibling projection; `defineServerEntry` infers `Site` / `Language` / `ClientContext` / `ReactContext`; `defineClientEntry<typeof server>` extracts `Site` / `ClientContext` from the server entry; `getSite` required when config has >1 site); optional `middleware` / `onListen` / `onHydrate` / dual-entry `getRouterContext`; ALS CSP nonce; server `language` for Document vocab; always-on `SkuProvider` + `createSkuContexts<typeof server, typeof client>()` (`useSite` typed from `getSite`, `useClientContext` / `useReactContext`); create template `ssr` (MAY omit `sites`; `expressTrustProxy: true`); reused `devServerMiddleware`; `usePreloadRoute` and `useInsertHtml` on `sku/runtime`.
- **Deps:** `react-router` optional peer `^8`; Express 4 shared with webpack SSR (no 4 → 5 bump).
- **Docs / release:** Product + Migrating docs describe **Managed Data Mode** (API) vs **SSR** (render strategy); cover `routesEntry`, multi-site flat `routes` + `sites` + `getSite`, `define*Entry` + `createSkuContexts<typeof …>`, three value channels + root layout wrapping, `onListen`, `expressTrustProxy`, webpack `onStart` → `onListen`; related config/CSP/Vite docs; data-loading hierarchy + red warning against `req` in context; Data Mode dual `getRouterContext` patterns (including client-nav ≠ initial SSR location); Apollo streaming hydration walkthrough (`useInsertHtml`, `getReactContext` + root-layout provider, nonce on injected scripts, cache reuse across hydration); experimental warning + changeset; Express 5 deferred.
- **Fixtures/tests:** SSR fixture (streaming, CSP, entries, chunks, vocab, relative `publicPath`, multi-site `sites` + `getSite`, sku context hooks); `onListen` / `expressTrustProxy` coverage; a `stream-insert-html` fixture proving Apollo streaming hydration end to end via `getReactContext` + root layout (server-run queries not refetched on hydrate; post-hydration queries still fetch); translations adapters; create template tests; config edge cases validation-only.
- **Module identity (published installs):** App hooks via `sku/runtime` and sku’s `SkuProvider` / insert-html / preload / nonce storage MUST share one module instance. Design Decision 26: consolidate sku runtime imports onto `sku/runtime` **and** `optimizeDeps.exclude` for `'sku'` / `'sku/runtime'` (tsdown `unbundle: true` alone is insufficient under Vite dep-optimization). Covered by a Node assert + existing SSR browser tests; dedicated tarball e2e deferred.
- **Adopt:** Opt-in via `buildType`; document hydrate; relative asset-only `publicPath`; no `public` folder / `dangerouslySetViteConfig`; shared `__sku_alias__*` entries (incl. `routesEntry`); webpack-aligned production defines where they overlap.
