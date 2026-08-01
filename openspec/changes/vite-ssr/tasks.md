## 1. Config and mode

- [x] 1.1 Add `buildType`; reject webpack + `ssr`, `-ssr` when set, absolute/`CDN` `publicPath`
- [x] 1.2 Vite SSR single-port: bake `__SKU_DEFAULT_SERVER_PORT__` from `port`; reject / untype `serverPort`; `PORT` still overrides at runtime
- [x] 1.3 Hard-error on Vite SSR `sku start` / `sku build` when configured `public` directory exists; message advises importing assets instead
- [x] 1.4 Disable Vite `publicDir` and `copyPublicFiles` for Vite SSR (static Vite / webpack unchanged)
- [x] 1.5 Add `react-router` as optional peerDependency `^8` for Vite SSR (fixtures/template install RR 8; do not force webpack fixtures onto RR 8); fix `bundler` JSDoc so Vite is not described as static-only
- [x] 1.6 Hard-error when Vite SSR sets `dangerouslySetViteConfig`; omit decorator plugin on SSR graph; point error at sku-support
- [x] 1.7 Remove `dangerouslySetViteConfig` from Vite SSR fixtures (e.g. translations `makeStableViteHashes`); use a supported path for stable hashes if still needed

## 2. Entries and runtime

- [x] 2.1 Require dual-entry `routes` + `onRequest` / `middleware` / `onHydrate` (hard errors on missing named exports; no noops; no early file-existence gate)
- [x] 2.2 Wire server-local `language` and `clientContext` → `onHydrate({ clientContext })` (provider wiring lives in §10)
- [x] 2.3 Mount server-entry `middleware` (start + prod); optional `devServerMiddleware` start-only before it
- [x] 2.4 `sku start` / `sku build`: middlewareMode, sibling `client/` + `server/`, Document stream, document hydrate
- [x] 2.5 Abort-before-write; forward loader/action Responses and headers; `statusCode` + ErrorBoundary; `waitForAll`; `httpsDevServer`
- [x] 2.6 Skip `transformIndexHtml` on SSR; manifest assets; auto `moduleId`
- [x] 2.10 Mount `vitePluginSsrCss` on the Vite SSR serve graph with SSR module-graph entries; put the virtual stylesheet URL in Document `assets.css` on `sku start`; move HMR cleanup off `transformIndexHtml` (client entry / bootstrap); mark the Document link for cleanup
- [x] 2.11 Mount `telemetryPlugin` on the Vite SSR serve graph with `type: 'ssr'`; deliver page-load + HMR clients via client entry / bootstrap (not `transformIndexHtml`); mark `initialPageLoad` when the SSR dev server is ready
- [x] 2.7 Resolve consumer entries via shared `__sku_alias__serverEntry` / `__sku_alias__clientEntry` (same aliases as static Vite)
- [x] 2.8 Promise-scrub loader/action data; strip production `Error.stack`; harden Express→Fetch adapter (array headers; reconstruct body when stream consumed)
- [x] 2.9 Import `virtual:sku/polyfills` at the top of the Vite SSR browser client entry (`vite-ssr-client.tsx`; covered by the start-only `.dev` dynamic load of that entry) so config `polyfills` load before hydrate — parity with static `vite-client.tsx` / webpack SSR client; do not load into the Node server entry
- [x] 2.12 Register the selected site route tree from the client entry; export `usePreloadRoute` from a new `sku/ssr` subpath (both `lazy` shapes; no-op when unregistered + dev warning on client invoke)

## 3. Assets and publicPath

- [x] 3.1 Treat `publicPath` as the static asset prefix only — not React Router basename; bake `__SKU_PUBLIC_PATH__` (not Vite `BASE_URL`)
- [x] 3.2 `sku start` ignores `publicPath` and serves Vite bootstrap from `/` (webpack SSR start parity); `sku build` / production keep `config.base` + static assets under `publicPath`
- [x] 3.3 Assert start HTML uses `/@vite/client` and prod HTML uses the configured prefix; fixture for relative `/static/...` assets with app routes outside that prefix

## 4. CSP and vocab

- [x] 4.1 Shell CSP headers (enforcing and/or Report-Only); lazy single nonce only when requested; Async Local Storage holds nonce only
- [x] 4.2 Align production defines with webpack: `__SKU_CSP__` object (incl. report-only fields); remove `import.meta.env.SKU_*` / `SKU_LANGUAGES`
- [x] 4.3 Vocab: register language chunk only when `onRequest` returns `language`; no allowlist / sole-language default; no `addLanguageChunk` / client forward
- [x] 4.4 When vocab / `languages` is active: resolve `@vocab/vite/runtime` from sku via `createRequire(import.meta.url)` and alias the export file in shared Vite `resolve.alias`; do not alias the `@vocab/vite` package root
- [x] 4.5 Validate Vite SSR with vocab (translations fixture) without a consumer direct `@vocab/vite` dependency

## 5. Fixtures and tests

- [x] 5.1 Vite SSR fixture: streaming Suspense, required entries/exports, middleware, CSP (+ report-only), document hydrate, vocab when configured, ≥2 distinct lazy route chunks
- [x] 5.2 E2E/smoke: shell-first stream, document hydration, HMR preamble
- [x] 5.12 Assert Vite SSR `sku start` document includes the SSR-CSS virtual stylesheet link (and does not call `transformIndexHtml`)
- [x] 5.13 Assert Vite SSR `sku start` emits `start.initial` / `start.rebuild` telemetry (or equivalent smoke covering client script + WS wiring)
- [x] 5.3 Tests: redirects; `waitForAll`; errored-route status; loader `Set-Cookie`; HTTPS start; missing named-export hard errors; nonce request/reuse; abort-before-write
- [x] 5.4 Tests: `devServerMiddleware` in `sku start`; absent from production server bundle / responses
- [x] 5.5 Tests: `onHydrate` receives `clientContext` only; no language in bootstrap / request-context; no public `getSkuLanguage`
- [x] 5.6 Tests: language chunk from `onRequest.language` / omit → no chunk; auto `moduleId` preloads; missing / non-array `routes` hard-error
- [x] 5.7 Fixture: `PreloadingLink` built on `usePreloadRoute` (drop app-side routes context); production hover test for lazy chunk; assert a foreign-site path does not warm
- [x] 5.8 Unit tests for simplified language resolution and webpack-aligned production defines
- [x] 5.9 Config/command validation only for edge cases (webpack + `ssr`, `-ssr` with `buildType`, absolute/`CDN` `publicPath`, Vite SSR + `serverPort`, existing `public` directory, Vite SSR + `dangerouslySetViteConfig`) — no browser e2e
- [x] 5.11 Test: Vite SSR + `dangerouslySetViteConfig` hard-errors at config validation
- [x] 5.10 Translations fixture: Vite SSR adapters (shared `App` + vocab; dedicated entries; `sku.config.vite-ssr.ts`) covering `en` / `fr` / `en-PSEUDO` via `?pseudo=true`

## 6. Create template

- [x] 6.1 `@sku-lib/create` `vite-ssr` template (dual `routes` scaffold); leave static `vite` unchanged
- [x] 6.2 Lazy pages use named `Component` (not default export); Migrating examples match

## 7. Docs and release

- [x] 7.1 Docs: product + Migrating docs, `vite.md`, `csp.md`, `configuration.md`, create READMEs; experimental / not-for-production warning
- [x] 7.2 Migrating: webpack dual-port → Vite SSR single `port`; `dist/server/server.js` + sibling `client/` / `server/` layout
- [x] 7.3 Document CJS interop for Vite SSR `sku start` + `__UNSAFE_EXPERIMENTAL__cjsInteropDependencies` (docs only; no runtime error rewrite; no new baked-in defaults)
- [x] 7.4 Discourage `public` for Vite SSR in product + `configuration.md`; Migrating calls out moving off the folder
- [x] 7.10 Document that Vite SSR does not support `dangerouslySetViteConfig` (hard-error; raise use-cases via sku-support) in `configuration.md` + product / Migrating
- [x] 7.5 Prefer render-time data loading via Suspense with clients from Providers (**superseded by §13** — `useReactContext` / `useClientContext`); loaders opt-in for waterfalls / document redirects / headers; no Express `req` → loader bridge
- [x] 7.6 Migrating: server-only loaders vs client route graph (+ explicit `moduleId` when needed); Braid reset-before-Braid on `sku start`; client-only / window libraries (**superseded by §13** — `getReactContext`); Jest → Vitest prerequisite; `#` pathAliases / migrate-root-resolution
- [x] 7.7 Drop “install `@vocab/vite` yourself” from product + Migrating once sku-owned alias is in place
- [x] 7.8 Document Express 4 (shared sku major) and React Router 8 as optional peer; note future major upgrades may be breaking (middleware + Data Mode); do not document Express 5 for this release
- [x] 7.11 Docs: `routing.md` intent preloading with `usePreloadRoute`; note Data Mode has no `<Link prefetch>`
- [x] 7.9 Changeset: experimental / not-for-production; React Router 8 optional peer; Express stays on 4; breaking-major policy for later upgrades; no Express 5 bump; no Jest RR8 transforms

## 8. Express↔render context (`onRequest` req + dual `getRouterContext`)

- [x] 8.1 Types: change `SkuSsrOnRequest` to `{ req }` (Express only; drop Fetch `request`); add optional server/client `getRouterContext` export types
- [x] 8.2 Thread Express `req` into `onRequest` only (`createHtmlRenderMiddleware` / render path); do not pass Fetch `Request` into `onRequest`; `query()` stays Fetch-only
- [x] 8.3 Wire optional server `getRouterContext({ request, req })` → `query(..., { requestContext })`
- [x] 8.4 Wire optional client `getRouterContext` → `createBrowserRouter({ getContext })` (wrap if injecting `clientContext`)
- [x] 8.5 Fixture/template: migrate `onRequest` to `{ req }`; middleware-attached state → `clientContext` / `getRouterContext` (see 10.5); dual `getRouterContext` with client nav to a non-initial location
- [x] 8.6 Tests: `onRequest` receives `req` only; server/client `getRouterContext` wiring; omit optional → default behaviour
- [x] 8.7 Docs: `entries.md` / `data-loading.md` / `middleware.md` (+ migrate / routing cross-links) — hierarchy, Data Mode vs Framework Mode, `onRequest({ req })` only, Express `Request` module augmentation for middleware-appended fields (`user` / `log` example), red warning against `req` in context, client-nav ≠ initial SSR example
- [x] 8.8 Changeset: note `onRequest` args (`{ request }` → `{ req }`) + optional `getRouterContext` if needed
- [x] 8.9 Rename dual-entry export `getContext` → `getRouterContext` (types `SkuSsrServerGetRouterContext` / `SkuSsrClientGetRouterContext`; RR `createBrowserRouter({ getContext })` unchanged)

## 9. `routesEntry` + site-scoped routes via optional `sites`

- [x] 9.1 Config: add `routesEntry` (default `src/routes.tsx`); resolve path on sku context; alias `__sku_alias__routesEntry` into both Vite SSR graphs; document in `configuration.md`
- [x] 9.2 Types: export `SkuSsrRouteObject = RouteObject & { sites?: string[] }`; require named `routes` on `routesEntry`; hard-error missing/non-array `routes`; require `onRequest` return field `site`
- [x] 9.3 Runtime: load `routes` from `routesEntry` only (sku wrappers); drop dual-entry `routes` require from client/server entries
- [x] 9.4 Pre-build: for each config site name, filter `routes` by `sites` membership (omit ⇒ all sites; no parent→child inheritance); strip `sites` before RR; bake site-name list for production client if needed
- [x] 9.4a Config: Vite SSR requires non-empty `sites` (≥1 site name); hard-error when empty; drop empty-`sites` soft path in site-name resolution
- [x] 9.5 Server: take `site` from `onRequest`; select pre-built tree for `createStaticHandler`; fail closed (missing/invalid/unknown site); do not derive site from config hosts
- [x] 9.6 Client: read hydrated `site` from bootstrap for `createBrowserRouter` (same site as SSR; not `onHydrate` arg)
- [x] 9.7 Fixture + translations + create template: set `routesEntry`; export `routes` from routes module only; remove `routes` / `routesBySite` re-exports from client/server entries; ≥2 sites; shared routes omit `sites`; site-only routes set `sites`; `onRequest` returns site from request; assert foreign-site path does not match; single-site template returns its sole site
- [x] 9.7a Template + any single-site fixtures/docs: declare non-empty config `sites`; `onRequest` returns a configured site name (not an invented sole-site placeholder)
- [x] 9.8 Tests: missing/invalid `routes` on `routesEntry`; missing/invalid/unknown `site` fail closed; omit `sites` ⇒ all sites; explicit `sites` filters; no inheritance; config hosts alone do not select the tree
- [x] 9.8a Tests: empty config `sites` hard-errors for Vite SSR
- [x] 9.9 Docs: routing / entries / index / migrate / vite — `routesEntry` + flat `routes` + optional `sites` + `onRequest.site`; multi-site product story (not `routesBySite` / dual-entry re-exports / language param / union+allowlist / sku host matching)
- [x] 9.9a Docs: Vite SSR requires non-empty config `sites`; template/examples use a real configured site name; drop empty-`sites` soft-path wording
- [x] 9.10 Changeset: note `routesEntry` + flat `routes` + optional `sites` + required `onRequest.site` (in-progress API; replaces dual-entry `routes` / rejected `routesBySite`)

## 10. `Providers` outside the router + init-time static handler

**Superseded by §13** for how request-scoped values reach React. Historical work kept the handler-at-init / outside-the-router split; §13 replaces app `Providers` with always-on `SkuSsrProvider` + `getReactContext`.

Supersedes the earlier tree-mounted `AppWrapper`: router-aware wrapping becomes an app-owned root layout route, and sku's entry export moves outside the router.

- [x] 10.3 Server: build `createStaticHandler` per site at init; per request select that handler and call only `query()` / `createStaticRouter`
- [x] 10.1 Types: replace `SkuSsrAppWrapper` with `SkuSsrProviders` / `SkuSsrProvidersProps<Context>` (`children` + `site` + `clientContext`); rename `onHydrate` args to `{ clientContext }`; keep provider components out of the `onRequest` / `onHydrate` return types
- [x] 10.2 Delete `withAppWrapperLayout.tsx` and `SKU_APP_WRAPPER_ROUTE_ID`; sku no longer wraps the route tree for providers
- [x] 10.3a Server: render optional `Providers` between `Document` and `StaticRouterProvider` in `render.tsx`, passing `site` + `clientContext`; assert `render.tsx` no longer imports `createStaticHandler`
- [x] 10.4 Client: render optional `Providers` between `Document` and `RouterProvider` with the same props from the hydrate bootstrap
- [x] 10.4a Dev-only warning when an entry's `Providers` renders hydration-relevant markup (providers are expected to be context-only)
- [x] 10.5 Fixtures + translations + create template: export named `Providers`; move `VocabProvider` / `useLocation` language resolution into the app's root layout route; delete the fixture's `requestUserId.ts` ALS helper and the client's module-level `hydratedUserId`
- [x] 10.5a Create template + fixtures: scaffold the app-owned root layout as a **pathless** route (no `path: '/'`) so it reads as a layout and keeps wrapping any future root-level sibling; child paths stay relative
- [x] 10.6 Tests: `Providers` render outside the router with `site` + `clientContext` on both sides; omitted ⇒ router rendered directly; route tree unwrapped; handler created once per site; dev DOM warning fires
- [x] 10.7 Docs: `entries.md` / `index.md` / `routing.md` / migrate — `Providers` vs root layout route vs `getRouterContext` (which channel for which consumer, noting RR 8 has no component-level router-context hook), no-DOM rule, where request-scoped values go
- [x] 10.8 Changeset: note provider export moves out of `onRequest` / `onHydrate` and out of the route tree; `AppWrapper` → `Providers`; `onHydrate({ context })` → `onHydrate({ clientContext })`

## 11. Streaming data transports (`useInsertHtml`) + Apollo

Opens the one seam apps cannot reach themselves (Decision 21a). Sku stays transport-agnostic; the fixture proves Apollo.

- [x] 11.1 Runtime: render-scoped injection queue + React context in a single module shared by `render` and `sku/ssr`; provide it outermost in `render.tsx` (around `Document`) so route code can reach it
- [x] 11.2 Runtime: `useInsertHtml()` exported from `sku/ssr`; silent no-op with no injection context (client graph); never throws
- [x] 11.3 Server: Node transform on the response pipe that renders queued nodes to markup and writes them before the next React chunk, flushing the remainder at stream end; works for `onShellReady` and `waitForAll`
- [x] 11.4 Fixture `stream-insert-html`: Apollo Client 4 + `@apollo/client-react-streaming` `buildManualDataTransport({ useInsertHtml })`, provider as dual-entry `Providers` (**superseded by §13** — `getReactContext` + root layout), GraphQL endpoint served from server-entry `middleware`, `extraScriptProps={{ nonce: getCspNonce() }}` on the server entry only
- [x] 11.5 Fixture: a route that queries during SSR and a route that queries only after hydration (client navigation), so cache reuse and fresh fetches are separately observable
- [x] 11.6 Tests: injected markup lands before hydration; no-op off the SSR path without throwing; nonce present in `script-src`; injection survives `waitForAll`
- [x] 11.7 E2E: server-run query data unchanged after hydration with no refetch; post-hydration query fetches; passes on both `sku start` and production build (guards the `browser` / `node` condition builds)
- [x] 11.8 Docs: `data-loading.md` Apollo streaming walkthrough (**superseded by §13** for provider mount); `entries.md` / `csp.md` cross-links; migrate — drop two-pass `getDataFromTree`; state loader-transported query refs are unsupported and why
- [x] 11.9 Changeset: `useInsertHtml` on `sku/ssr`; sku ships no Apollo dependency or config

## 12. Flatten request-entry getters

Replace `onRequest` with sync getters; make `middleware` / `onHydrate` optional.
(**Superseded by §13** for the public contract shape — default-exported entry object, not per-getter named exports.)

- [x] 12.1 Types: drop `SkuSsrOnRequest` / `SkuSsrOnRequestResult`; add `SkuSsrGetSite` / `SkuSsrGetLanguage` / `SkuSsrGetClientContext` (sync, `{ req }` only)
- [x] 12.2 Server entry: optional getter + middleware reads; init-time `getSite` required when `__SKU_SITES__.length > 1`
- [x] 12.3 Client entry: optional `onHydrate`
- [x] 12.4 `render.tsx`: call getters before `query()`; sole config site when `getSite` omitted; validate when present
- [x] 12.5 Production / start servers: tolerate absent `middleware`
- [x] 12.6 Fixtures + translations: migrate off `onRequest` to getters
- [x] 12.7 Create template: realistic `middleware` + `Providers` + `onHydrate` (**superseded by §13** — drop `Providers`, default entry objects + `createSkuSsrContexts`); single-site omits `getSite`
- [x] 12.8 Tests: single-site no `getSite`; multi-site missing `getSite` init error; unknown site per-request; omit `onHydrate`; omit `middleware`
- [x] 12.9 Docs: entries / providers / multi-language / routing / data-loading + migrate — getters, optional middleware/onHydrate, sync/pure recommendation (**§13 rewrites providers docs + entry shape**)
- [x] 12.10 Changeset: note getters replace `onRequest`; `middleware` / `onHydrate` optional (experimental API)

## 13. Always-on SkuSsrProvider + default entry objects + three value channels

Replaces app-authored dual-entry `Providers`. Request entries are one default-exported object via `defineServerEntry` / `defineClientEntry` (not per-getter named exports).

- [x] 13.1 Types: drop `SkuSsrProviders` / `SkuSsrProvidersProps`; add `SkuSsrServerEntry` / `SkuSsrClientEntry`; export `defineServerEntry` / `defineClientEntry` (zero-runtime, `NoInfer` sibling typing); extend runtime `getRouterContext` args with `site` / `clientContext` / `reactContext`; export `createSkuSsrContexts<typeof server, typeof client>()` from `sku/ssr`
- [x] 13.2 Runtime: load `serverEntry` / `clientEntry` via **default export** object; call optional properties; always-on `SkuSsrProvider` in `render.tsx` / client entry (`site` + `clientContext` + `reactContext`); shared context module with `createSkuSsrContexts` (`unbundle: true`)
- [x] 13.3 Runtime: call order `getSite` → `getLanguage` → `getClientContext` → `getReactContext` → `getRouterContext` → `query()`; pass sibling values; do not serialise `reactContext`
- [x] 13.4 Runtime: remove optional `Providers` mount, markup-probe warnings, and related tests
- [x] 13.5 `createSkuSsrContexts<typeof server, typeof client>()`: extract `ClientContext` / `ReactContext` from entry typeofs; typed `useSite` / `useClientContext` / `useReactContext`; no per-property `defineGet*`; no required hand-written context aliases
- [x] 13.6 Wire client `getReactContext({ site, clientContext })` and client `getRouterContext({ site, clientContext, reactContext })` (wrap RR zero-arg `getContext`)
- [x] 13.7 Fixtures: `defineServerEntry` / `defineClientEntry` default exports; remove `Providers.tsx`; vite-ssr uses `createSkuSsrContexts<typeof …>` + hooks; stream-insert-html moves Apollo mount to root layout via `useReactContext` + dual-entry `getReactContext` (`makeClient` / server nonce)
- [x] 13.8 Create template: `define*Entry` + `createSkuSsrContexts<typeof …>` scaffold; no `Providers`; root layout ready for isomorphic provider mounts
- [x] 13.9 Tests: sibling projection into later getters; hooks read provider values; omit `getClientContext` / `getReactContext` → `undefined`; Apollo fixture still proves cache reuse without `Providers`
- [x] 13.10 Docs: replace `providers.md` / entries / data-loading / migrate — `define*Entry` inference + `createSkuSsrContexts<typeof …>` example, three-channel Markdown table, root-layout Apollo, no Mermaid required; replace `Providers` API docs in place
- [x] 13.11 Changeset: experimental API — `defineServerEntry` / `defineClientEntry`; default-exported entry objects; `getReactContext` + `SkuSsrProvider` + `createSkuSsrContexts<typeof …>`; sibling args on later getters (do **not** label as breaking; Vite SSR has not shipped)

## 14. Infer Site / Language in defineServerEntry; type useSite

Fold-in: `getSite` / `getLanguage` returns join the existing `C` / `R` inference scope; `useSite` stops being hardcoded `string`.

- [x] 14.1 `defineServerEntry`: add generics `S` / `L`; infer from `getSite` / `getLanguage` returns; type later sibling `site` as `NoInfer<S>` (keep `defineClientEntry` `site: string`)
- [x] 14.2 `createSkuSsrContexts`: extract `Site` from server `getSite` (`string` when omitted); type `useSite(): Site`
- [x] 14.3 Fixture / template: drop widening `SkuSsrGetSite` annotations; narrow inside `getSite`; remove `useSite() as FixtureSite` casts where inference covers them
- [x] 14.4 Docs (`providers` / `entries`): document Site / Language inference; warn that annotating with `SkuSsrGetSite` / `SkuSsrGetLanguage` widens to `string`
- [x] 14.5 Type-level / unit coverage: narrowed `getSite` → typed `useSite` + sibling `site`; omit `getSite` → `useSite` is `string`

## 15. Type defineClientEntry from ServerEntry

Fold-in: client callbacks cannot infer `ClientContext` / `Site` (inputs only) — pass `typeof server` like `createSkuSsrContexts`.

- [x] 15.1 `defineClientEntry<ServerEntry>`: extract `Site` / `ClientContext` via the same helpers as `createSkuSsrContexts`; type `onHydrate` / client getter `site` + `clientContext` from those; still infer `ReactContext` from client `getReactContext`; omit type arg ⇒ `ClientContext` is `undefined` and `site` is `string`
- [x] 15.2 Fixture / template / create snapshot: `defineClientEntry<typeof server>` (type-only server import)
- [x] 15.3 Docs (`providers` / `entries` / data-loading examples): document `defineClientEntry<typeof server>`; stop claiming client-side `ClientContext` inference alone
- [x] 15.4 Type-level / unit coverage: narrowed server `getClientContext` / `getSite` → typed client callbacks; omit `ServerEntry` ⇒ `undefined` / `string`
- [x] 15.5 Changeset: note `defineClientEntry<typeof server>` types `ClientContext` / `Site` from the server entry (experimental API; do **not** label as breaking)

## 16. Production static before middleware

Catch-all / Melways-style server-entry middleware must not eat hashed client assets under `publicPath`.

- [x] 16.1 Production `listen`: mount `express.static(publicPath)` after request-context and **before** server-entry `middleware` (start order unchanged)
- [x] 16.2 Test: catch-all / returning middleware does not prevent serving an existing client asset under `publicPath`
- [x] 16.3 Docs: `middleware.md` production mount order; migrate-from-webpack note that Vite SSR serves `client/` under `publicPath` before middleware

## 17. Server-entry `onListen` + config `expressTrustProxy`

Post-listen lifecycle (webpack `onStart` window) and opt-in Melways-shaped trust proxy.

- [x] 17.1 Types: add optional `onListen` on `SkuSsrServerEntry` / `defineServerEntry` (`{ app, httpServer, port }` → `void | Promise<void>`)
- [x] 17.2 Config: add optional boolean `expressTrustProxy` (Vite SSR schema/validation/JSDoc); when `true`, set `app.set('trust proxy', 1)` before listen; omit/false → Express default
- [x] 17.3 Runtime: call `onListen` once after middleware + HTML mounted and `listen` succeeds (shared production `listen` + `createDevSsrServer`); await promise; failure fails startup; do not re-call on server-entry HMR
- [x] 17.4 Create template: set `expressTrustProxy: true` in `sku.config`
- [x] 17.5 Tests: `onListen` receives `{ app, httpServer, port }`; `expressTrustProxy: true` → `trust proxy === 1`; omit → default; failure rejects startup
- [x] 17.6 Docs: `entries.md` (`onListen`); `configuration.md` (`expressTrustProxy` → hop count `1`); migrate-from-webpack (`onStart` → `onListen` bag; trust proxy via config)
- [x] 17.7 Changeset: note `onListen` + `expressTrustProxy` (experimental API; do **not** label as breaking)

## Deferred

- Optional compose slot above the router (app `Providers`-like) — deferred until root-layout + `getReactContext` prove insufficient
- Public `useInitialLanguage` / language-in-React-context hook — deferred (analytics); `getLanguage` stays Document vocab preload only (return type still inferred on the server entry)
- Generic `SkuSsrRouteObject<Site>` — follow-on; client-entry `Site` / `ClientContext` via `defineClientEntry<typeof server>` is §15; components also use `useSite()`
- Mermaid / VitePress Mermaid plugin for channel diagrams — optional polish; Markdown table is the required docs shape
- Provider component returned from request-entry getters — Non-Goals (forced `createStaticHandler` onto the hot path)
- Sku mounting providers inside the route tree as a pathless layout — Non-Goals (router-aware wrapping is the app's root layout route)
- Consumer-authored Async Local Storage as the documented route to request state — Non-Goals (`SkuSsrProvider` + hooks instead)
- Dual-entry `routes` re-exports / env-split route modules as a product feature — Non-Goals (`routesEntry` is one truth)
- Runtime dual-`routes` / server↔client tree equality validation — Non-Goals (unnecessary with `routesEntry`)
- Union tree + site allowlist as documented multi-site product story — Non-Goals
- `routesBySite` map export — Non-Goals (trialled and rejected; replaced by flat `routes` + `sites`)
- Parent→child inheritance of `sites` — Non-Goals (explicit annotation required)
- Overloading config `routes` (prerender path lists) as the Vite SSR RouteObject entry — Non-Goals (`routesEntry` instead)
- Sku-owned site resolution from config `hosts` / `sites[].host` — Non-Goals (apps provide `getSite` on the server entry object)
- Sku reading site / language / clientContext from a conventional `req` field; sku push API (`setRequestContext`) — Non-Goals (libs contribute getter properties apps spread into the entry object)
- `onRequest`-style combined value return bag / resolver — Non-Goals (optional getters on the default entry object)
- Per-getter named exports / per-property `defineGet*` helpers — Non-Goals (`defineServerEntry` / `defineClientEntry` are the inference scopes)
- Async request-entry getters — Non-Goals (sync/pure; libs may memoise on `req`; optional async `getRouterContext` remains)
- Tolerating a missing `serverEntry` / `clientEntry` file — Non-Goals (omit unused properties on the default export instead)
- Sku-owned per-site path expansion / per-site JS bundles / routes returned from getters — Non-Goals
- Vite SSR support for config `public` / unhashed public assets — Non-Goals until definitive need
- Sku-owned listen logging by default / `onBeforeListen` — Non-Goals (apps log in `onListen`; top-level for pre-bind setup)
- Soft-defaulting Express `trust proxy` without config — Non-Goals (opt-in `expressTrustProxy`; other values via `onListen`)
- Express 5 (sku-wide; webpack SSR + Vite SSR + `sku serve`) — later change
- React Router majors beyond 8 — later releases
- Jest support for React Router 8 (webpack) — out of scope for this change
- Automatic `*.server.ts` client strip — Non-Goals (docs / convention only)
- Auto-inject Braid reset into sku Vite SSR server entry — Non-Goals (Braid optional; docs only)
- Raw Express `req` in `RouterContextProvider` — Non-Goals (red-warn in docs; project values via dual `getRouterContext`)
- Framework Mode server-only `getLoadContext(req, res)` as sole API — Non-Goals (Data Mode dual request entry instead)
- Passing `res` into getters / `getReactContext` / `getRouterContext` — Non-Goals v1
- Passing Fetch `Request` into early getters — Non-Goals (`{ req }` only; Fetch on `query` / server `getRouterContext`)
- `@sku-lib/vite/loadable` Document preloads for Vite SSR — Non-Goals (static / prerender only; optionally gate `preloadPlugin` to static later)
- Sku-owned Apollo dependency / provider / config — Non-Goals (`useInsertHtml` seam only)
- `@apollo/client-integration-react-router` loader transport (`apolloLoader` / `preloadQuery` query refs in loader data) — Non-Goals (alpha, RR7 peer, needs streaming loader data)
- Streaming (turbo-stream) loader-data serialization — Non-Goals (would pull sku toward Framework Mode)
- Two-pass `getDataFromTree` SSR — Non-Goals (incompatible with streaming)
