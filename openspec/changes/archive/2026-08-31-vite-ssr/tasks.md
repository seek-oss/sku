# Implementation tasks

Living specs (`managed-data-mode`, `ssr`, `csp`) and design Decisions are the contract.
This checklist is the end-state work in dependency order.
It is not a history of intermediate APIs.

## 1. Config, peers, and rejects

- [x] 1.1 Add `buildType: 'ssr' | 'static'`. Reject webpack + `ssr`, suffixed `-ssr` when `buildType` is set, and absolute/`CDN` `publicPath`.
- [x] 1.2 SSR single-port: bake `__SKU_DEFAULT_SERVER_PORT__` from `port`. Reject / untype `serverPort`. Keep `PORT` override at runtime.
- [x] 1.3 Hard-error when SSR has a configured `public` directory. Disable Vite `publicDir` and `copyPublicFiles` for SSR only.
- [x] 1.4 Hard-error when SSR sets `dangerouslySetViteConfig` or `vitePlugins`. Omit both from the SSR plugin graph. Point errors at sku-support.
- [x] 1.5 Add optional peer `react-router` `^8` for SSR consumers. Fix `bundler` JSDoc so Vite is not static-only.
- [x] 1.6 Add optional boolean `expressTrustProxy`. When `true`, set `app.set('trust proxy', 1)` before listen.
- [x] 1.7 Config validation unit tests for the rejects and soft paths above (no browser e2e).

## 2. Package surface (`sku/runtime`)

- [x] 2.1 Export Managed Data Mode APIs from `sku/runtime` (not a strategy-branded subpath). Drop `Ssr` from public type names.
- [x] 2.2 Keep sku-only shared-state symbols off public `sku/runtime`. Mount them via private package `imports` (e.g. `#runtime/*`) that resolve to the same physical modules public hooks re-export (`SkuProvider`, insert-html helpers, site route registration, request-context runner).
- [x] 2.3 Add `optimizeDeps.exclude` for `'sku'` and `'sku/runtime'` (shared constant). Assert it in unit tests.
- [x] 2.4 Import `virtual:sku/polyfills` at the top of the SSR browser client entry only.

## 3. `routesEntry` and site-scoped trees

- [x] 3.1 Add config `routesEntry` (default `src/routes.tsx`). Alias `__sku_alias__routesEntry` into both SSR graphs.
- [x] 3.2 Export `SkuRouteObject = RouteObject & { sites?: string[] }`. Require named `routes` array. Hard-error when missing or non-array.
- [x] 3.3 Soft-default empty/omitted config `sites` to `['default']`. Keep multi-site behaviour when `sites.length > 1`.
- [x] 3.4 At init, pre-build one route tree per resolved site name. Omit `sites` ⇒ all sites. No parent→child inheritance. Strip `sites` before React Router.
- [x] 3.5 Fail closed on missing/invalid/unknown site. Do not select the tree from config hosts.

## 4. Request entries and always-on `SkuProvider`

- [x] 4.1 Types: `SkuServerEntry` / `SkuClientEntry`. Export zero-runtime `defineServerEntry` / `defineClientEntry` with sibling `NoInfer` typing.
- [x] 4.2 Infer `Site` / `Language` / `ClientContext` / `ReactContext` from getter returns. `defineClientEntry<typeof server>` types client `site` / `clientContext` from the server entry.
- [x] 4.3 Load server/client entries as default-exported objects. Call optional properties only.
- [x] 4.4 Call order before `query()`: `getSite` → `getLanguage` → `getClientContext` → `getReactContext` → optional `getRouterContext`. Pass sibling values. Do not serialise `reactContext`.
- [x] 4.5 Do not hard-error at init for omitted `getSite`. Types cover the getter. Sole resolved site when omitted.
- [x] 4.6 Always mount `SkuProvider` outside the router with `site` + `clientContext` + `reactContext`. No app-authored `Providers` export.
- [x] 4.7 Export `createSkuContexts<typeof server, typeof client>()` with typed `useSite` / `useClientContext` / `useReactContext`.
- [x] 4.8 Wire optional dual `getRouterContext` into `query({ requestContext })` and `createBrowserRouter({ getContext })`.
- [x] 4.9 Optional `middleware` and `onHydrate`. Tolerate absent middleware in start and production.
- [x] 4.10 Type-level / unit coverage for inference, omit paths, and sibling projection.

## 5. Start and build server runtime

- [x] 5.1 `sku start` / `sku build`: Vite middlewareMode, sibling `client/` + `server/`, Document stream, document hydrate.
- [x] 5.2 Resolve consumer entries via shared `__sku_alias__serverEntry` / `__sku_alias__clientEntry`.
- [x] 5.3 Build `createStaticHandler` per site at init. Per request select handler and call only `query()` / `createStaticRouter`.
- [x] 5.4 Abort-before-write. Forward loader/action Responses and headers. Errored-route `statusCode` + ErrorBoundary. `waitForAll`. `httpsDevServer`.
- [x] 5.5 Skip `transformIndexHtml` on SSR. Manifest assets. Auto `moduleId` for lazy routes.
- [x] 5.6 Mount `vitePluginSsrCss` on the SSR serve graph. Put the virtual stylesheet URL in Document `assets.css` on `sku start`.
- [x] 5.7 Mount `telemetryPlugin` with `type: 'ssr'`. Deliver page-load + HMR clients via client entry / bootstrap.
- [x] 5.8 Promise-scrub loader/action data. Strip production `Error.stack`. Harden Express→Fetch adapter.
- [x] 5.9 Hydrate client from bootstrap `site` (same as SSR). Call optional `onHydrate({ clientContext })` only.

## 6. Assets, `publicPath`, and production layout

- [x] 6.1 Treat `publicPath` as the static asset prefix only. Bake `__SKU_PUBLIC_PATH__`. Do not use Vite `BASE_URL` as React Router basename.
- [x] 6.2 `sku start` ignores `publicPath` and serves Vite bootstrap from `/`. Production keeps `config.base` + assets under `publicPath`.
- [x] 6.3 After client build, bake the Vite client manifest into the server output. Production entry loads the baked manifest without requiring sibling `client/`.
- [x] 6.4 Mount `express.static(publicPath)` only when sibling `client/` exists, after request-context and before server-entry `middleware`. Omit the mount when absent.
- [x] 6.5 Assert start HTML uses `/@vite/client` and prod HTML uses the configured prefix. Cover relative `/static/...` assets with app routes outside that prefix.

## 7. CSP

- [x] 7.1 Shell CSP headers (enforcing and/or Report-Only). Lazy single nonce only when requested. Async Local Storage holds nonce only.
- [x] 7.2 Align production defines with webpack (`__SKU_CSP__` object including report-only fields). Remove `import.meta.env.SKU_*` / `SKU_LANGUAGES`.
- [x] 7.3 Consume `ReportingEndpoint` values from `createSkuContext`. Support `cspReportTo` on the enforcing policy. Emit `Reporting-Endpoints` for URL-bearing endpoints.
- [x] 7.4 Cover CSP + report-only + report-to in fixture, e2e, and `buildCspHeaders` unit tests. Export `getCspNonce` from `sku/runtime`.

## 8. Vocab and language

- [x] 8.1 Register language chunk only when `getLanguage` returns a language. No allowlist / sole-language default. No client forward of language.
- [x] 8.2 When vocab / `languages` is active, resolve `@vocab/vite/runtime` from sku and alias the export file. Do not alias the package root.
- [x] 8.3 Validate SSR + vocab without a consumer direct `@vocab/vite` dependency.

## 9. Streaming HTML insert + intent preload

- [x] 9.1 Render-scoped injection queue + React context shared by `render` and `sku/runtime`. Provide it outermost around `Document`.
- [x] 9.2 Export `useInsertHtml()` from `sku/runtime`. Silent no-op off the SSR path. Never throws.
- [x] 9.3 Node transform on the response pipe writes queued markup before the next React chunk. Flush remainder at stream end. Works for `onShellReady` and `waitForAll`.
- [x] 9.4 Register the selected site route tree from the client entry. Export `usePreloadRoute` from `sku/runtime` (both `lazy` shapes. No-op when unregistered + dev warning on client invoke).

## 10. `onListen`

- [x] 10.1 Optional `onListen` on `SkuServerEntry` (`{ app, httpServer, port }` → `void | Promise<void>`).
- [x] 10.2 Call once after middleware + HTML mounted and `listen` succeeds. Await promise. Failure fails startup. Do not re-call on server-entry HMR.
- [x] 10.3 Tests: args shape, `expressTrustProxy` true/omit, `onListen` failure rejects startup.

## 11. Fixtures and tests

- [x] 11.1 SSR fixture: streaming Suspense, default entry objects, middleware, CSP (+ report-only), document hydrate, multi-site `routes` + `sites`, ≥2 lazy route chunks, `createSkuContexts` hooks.
- [x] 11.2 Translations fixture: SSR adapters with shared App + vocab. Cover `en` / `fr` / `en-PSEUDO`.
- [x] 11.3 Fixture `stream-insert-html`: Apollo Client 4 + `buildManualDataTransport({ useInsertHtml })`. Mount via `getReactContext` + root layout `useReactContext`. GraphQL from server-entry `middleware`. Nonce on server scripts only.
- [x] 11.4 E2E/smoke: shell-first stream, document hydration, HMR preamble, SSR-CSS link on start, telemetry wiring.
- [x] 11.5 Tests: redirects, `waitForAll`, errored-route status, loader `Set-Cookie`, HTTPS start, missing export hard errors, nonce request/reuse, abort-before-write.
- [x] 11.6 Tests: `devServerMiddleware` in start only. `onHydrate` receives `clientContext` only. Language chunk from `getLanguage` / omit. Auto `moduleId` preloads.
- [x] 11.7 Tests: site filtering, soft-default `'default'`, fail-closed unknown site, foreign-site path does not match, catch-all middleware does not block assets under `publicPath`.
- [x] 11.8 Tests: production server starts and streams without sibling `client/` when baked manifest is present. Dual-context / `sku/runtime` identity stays green under workspace link.
- [x] 11.9 Fixture `PreloadingLink` on `usePreloadRoute`. Production hover warms lazy chunk. Foreign-site path does not warm.

## 12. Create template

- [x] 12.1 `@sku-lib/create` template `ssr` with dual entry scaffold via `define*Entry` + `createSkuContexts`. Leave static `vite` unchanged.
- [x] 12.2 Flatten layout: pathless root layout route, `ssrContext`, named `Component` on lazy pages. Omit config `sites` and `getSite` (soft-default). Set `expressTrustProxy: true`.
- [x] 12.3 Update create generate tests and snapshots.

## 13. Docs and release

- [x] 13.1 Product docs: Managed Data Mode vs SSR naming, entries, routing, providers/channels, data-loading, middleware, CSP, configuration, experimental warning.
- [x] 13.2 Migrating: webpack dual-port → single `port`, `routesEntry`, getters, `onStart` → `onListen`, deploy layout, CJS interop docs, Jest → Vitest prerequisite.
- [x] 13.3 Deploy docs: baked manifest / server without sibling `client/`. Recommended external assets. Standalone Node static as experimentation only. Runtime `node_modules` required.
- [x] 13.4 Document unsupported SSR options (`public`, `dangerouslySetViteConfig`, `vitePlugins`, absolute `publicPath`). Document Express 4 + React Router 8 peer policy.
- [x] 13.5 Changeset: experimental / not-for-production Managed Data Mode SSR. End-state public names. Do not label unreleased API churn as breaking.

## 14. Inline lazy route authoring (docs / template / fixtures)

- [x] 14.1 Rewrite SSR routing docs in place: inline `lazy` in `routesEntry`; page modules own `loader` / `action` / `Component`; do not recommend per-page `route.ts` stubs.
- [x] 14.2 Align create template `ssr` to inline `lazy` (remove per-page `route.ts`; page modules under `src/pages/`).
- [x] 14.3 Align SSR fixtures to prefer inline `lazy` everywhere practical; update create snapshots / generate tests.
- [x] 14.4 Sweep product / Migrating / multi-language examples for leftover stub-folder happy-path wording; describe end state only.

## 15. React Router `instrumentations` pass-through

- [x] 15.1 Types: optional `instrumentations` on `SkuServerEntry` / `ServerEntryBody` as `Pick<ServerInstrumentation, 'route'>[]`, and on `SkuClientEntry` / `ClientEntryBody` as `ClientInstrumentation[]`.
- [x] 15.2 Wire server entry `instrumentations` into `buildSiteStaticHandlers` → each `createStaticHandler(routes, { instrumentations })` at module init.
- [x] 15.3 Wire client entry `instrumentations` into `createBrowserRouter(…, { instrumentations })`.
- [x] 15.4 Unit tests: omit path unchanged; provided arrays forwarded; server handlers still built once at init.
- [x] 15.5 Docs: brief entries coverage + server route-only vs client router+route note + link to React Router instrumentation guide. No dedicated Logging page.

## 16. Optional `mapRoutePath`

- [x] 16.1 Types: optional `mapRoutePath` on `routesEntry` with `{ path, site, parentSegments }` → `string[]`. Export a public type for the hook args/result.
- [x] 16.2 Pre-build: after `sites` filter, call `mapRoutePath` for string-`path` routes and for `index: true` (`path: ''`). Clone per returned entry. Preserve `lazy` / `handle`. Build `parentSegments` from source path-bearing ancestors. Empty array omits. Identity when omitted (`[path]` / `['']`). Never re-map clones.
- [x] 16.3 Init hard-errors for non-function export and non-`string[]` returns. Unit tests for identity, duplicate paths, nested `parentSegments`, empty omit, invalid return, and `moduleId` preservation on clones.
- [x] 16.4 Fixture + browser coverage for `/about` and a prefixed sibling path (and sites-scoped behaviour when practical).
- [x] 16.5 Review existing multi-language SSR fixtures (for example `translations`) and improve them with `mapRoutePath` where route paths are duplicated by language/prefix.
- [x] 16.6 Docs: multi-language / routing teach `mapRoutePath`. Remove shared `pageLazy` examples. Call out preload-safe cloning. Migrating mentions the hook.
- [x] 16.7 Index homes: call `mapRoutePath` for `index: true` with `path: ''`. Map `''` → keep index, non-empty → `path` clone without `index`. Identity `['']` when omitted. Unit/fixture/docs coverage for `/` + prefixed home. Do not re-map clones.
- [x] 16.8 Rename `expandRoutePath` / `ExpandRoutePath` → `mapRoutePath` / `MapRoutePath` in specs, docs, fixtures, and implementation.

## 17. Case-sensitive path matching by default

- [x] 17.1 During `buildRoutesForSite` / `buildSiteRouteTrees` pre-build, set `caseSensitive: true` when a route leaves it undefined. Preserve explicit `true` / `false`. Apply to `mapRoutePath` clones. Keep call order: sites → `mapRoutePath` → caseSensitive fill → strip `sites`.
- [x] 17.2 Unit tests: omitted → `true` and `/About` does not match `about`; explicit `false` preserved; clones from `mapRoutePath` get the fill.
- [x] 17.3 Docs (routing): state the case-sensitive default and per-route `caseSensitive: false` escape hatch. No config kill-switch. No wrong-case redirect behaviour from sku.

## 18. Site-typed `SkuRouteObject` and `skuContext` examples

- [x] 18.1 Generic `SkuRouteObject<Site extends string = string>` with recursive `children`. Export `SiteOf` from `sku/runtime`. Default `SkuRouteObject[]` keeps `sites` as `string[]`.
- [x] 18.3 Multi-site fixture types `routes` as `SkuRouteObject<SiteOf<typeof server>>[]`. Single-site template keeps unparameterized `SkuRouteObject[]`.
- [x] 18.4 Rename consumer `ssrContext.ts` → `skuContext.ts` in the create template, SSR fixtures, product / Migrating docs, and snapshots.
- [x] 18.5 Docs: teach `SkuRouteObject<SiteOf<typeof server>>` next to `createSkuContexts`. Note the union is `getSite`, not `sku.config`.

## 19. Document stream lifecycle hardening

- [x] 19.1 `streamDocument`: single-settle ownership per attempt (`open` → resolved / rejected / cancelled). Cancel rejects with abort reason and aborts React. Late callbacks no-op.
- [x] 19.2 Cancel MUST NOT start the ErrorBoundary recovery pass (including `waitForAll` pending). Keep one recovery pass only for real render failures via a fresh abandoned-then-retry attempt.
- [x] 19.3 HTML middleware: skip render when already disconnected; abort after resolve before any write (HTML or short-circuit `Response`); abort React on disconnect after `pipe`; swallow cancel rejections; forward genuine connected failures to Express.
- [x] 19.4 Insert/transform failure after pipe: abort React and error the Node response stream. Do not treat React `onError` as the success criterion for insert failures.
- [x] 19.5 Tests: already-aborted signal, abort during pending `waitForAll` (no ErrorBoundary), disconnect before Response write, disconnect after pipe, connected vs cancelled Express error paths, insert callback throw fails the stream.

## 20. Document stream ownership refactor

- [x] 20.1 Split one React attempt (`createDocumentAttempt`) from retry/cancel/deadline policy (`streamDocument` loop). Drop recursive retry and the `allowErrorRetry` flag.
- [x] 20.2 Replace `{ pipe, abort }` with `commit(destination, { signal, beforePipe })`. Subscribe abort before header writes. Recheck before `pipe`. Fold insert-html wrapping into commit.
- [x] 20.3 `render()` rejects on an already-aborted signal before `query()`. Recovery-setup throws reject. 10s sku-owned deadline from `streamDocument` start (no retry on timeout).
- [x] 20.4 HTML middleware always `commit`s document results with the disconnect signal. Split `ssrServerShared` (web request, sendResponse, middleware, listen).
- [x] 20.5 Tests: abort during `beforePipe` does not pipe; aborted signal skips actions/`query`; recovery-setup throw rejects; waitForAll deadline rejects without ErrorBoundary; abort of the recovery attempt.

## 21. Async getters

- [x] 21.1 Type `getClientContext` and dual-entry `getReactContext`/`getRouterContext` as `T | Promise<T>`.
- [x] 21.2 Unwrap with `Awaited` in extractors, `define*Entry` sibling args, and `createSkuContexts` hooks.
- [x] 21.3 Keep `getSite` / `getLanguage` synchronous.
- [x] 21.4 Server: `await getClientContext` then `await getReactContext` before `getRouterContext` / `query()`.
- [x] 21.5 Client: `await getReactContext` before `createBrowserRouter` / `hydrateRoot`.
- [x] 21.6 Type-level tests: Promise returns unwrap for hooks and sibling args. Dual-entry `getRouterContext` accepts Promise. `getSite` / `getLanguage` stay sync.
- [x] 21.7 Runtime tests: Promise-returning getters are awaited before `query()` / hydrate. Rejection fails the document or hydrate.
- [x] 21.8 Type dual-entry `getRouterContext` as `RouterContextProvider | Promise<RouterContextProvider>`.

## 22. Nested `undefined` in `clientContext`

- [x] 22.1 Widen `JsonValue` object values to `JsonValue | undefined`.
- [x] 22.2 After `getClientContext` resolves, one JSON-compatible walk: drop `undefined` object keys, coerce `undefined` array elements to `null`. Same value to sibling getters, `SkuProvider`, bootstrap, and `onHydrate`. Top-level omit/`undefined` stays JS `undefined`.
- [x] 22.3 Type-level tests: optional fields and `'dark' | undefined` type-check. Dates/functions still fail.
- [x] 22.4 Runtime tests: object-key drop, array `null` coerce, top-level `undefined` unchanged, SSR and hydrate agree.

## 23. Start mounts Vite before consumer middleware

- [x] 23.1 Reorder `createDevSsrServer`: request-context → Vite → `devServerMiddleware` → server-entry `middleware` → HTML.
- [x] 23.2 Tests: Vite asset URL (e.g. `/@vite/client`) is not handled by catch-all server-entry middleware. Document paths still reach consumer middleware + HTML. `devServerMiddleware` still runs after Vite, before server-entry, and stays out of production.
- [x] 23.3 Update `middleware.md` start mount order to match.

## 24. Three-channel docs

- [x] 24.1 Canonical section near the top of `data-loading.md` (after two-path intro, before “Prefer render-time”): table, JSON + nested-`undefined` rules, `createSkuContexts` / `useClientContext()` links, router context for loaders/actions/route middleware.
- [x] 24.2 `providers.md` and `entries.md` link that section instead of re-teaching the taxonomy.

## Deferred

See design Non-Goals and Resolved / deferred for the full list.
High-signal follow-ons only:

- Optional compose slot above the router if root layout + `getReactContext` prove insufficient
- Public language-in-React-context hook
- Opt-in auto / file-based route building on top of the light explicit `routes` + inline `lazy` contract (Decision 4b)
- Express 5 and React Router majors beyond 8 (later changes)
- SSR observability beyond instrumentations (`onRequestComplete`, Logging docs page, observability fixture)
