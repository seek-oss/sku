# Implementation tasks

Living specs (`managed-data-mode`, `ssr`, `csp`) and design Decisions are the contract.
This checklist is the end-state work in dependency order.
It is not a history of intermediate APIs.

## 1. Config, peers, and rejects

- [ ] 1.1 Add `buildType: 'ssr' | 'static'`. Reject webpack + `ssr`, suffixed `-ssr` when `buildType` is set, and absolute/`CDN` `publicPath`.
- [ ] 1.2 SSR single-port: bake `__SKU_DEFAULT_SERVER_PORT__` from `port`. Reject / untype `serverPort`. Keep `PORT` override at runtime.
- [ ] 1.3 Hard-error when SSR has a configured `public` directory. Disable Vite `publicDir` and `copyPublicFiles` for SSR only.
- [ ] 1.4 Hard-error when SSR sets `dangerouslySetViteConfig` or `vitePlugins`. Omit both from the SSR plugin graph. Point errors at sku-support.
- [ ] 1.5 Add optional peer `react-router` `^8` for SSR consumers. Fix `bundler` JSDoc so Vite is not static-only.
- [ ] 1.6 Add optional boolean `expressTrustProxy`. When `true`, set `app.set('trust proxy', 1)` before listen.
- [ ] 1.7 Config validation unit tests for the rejects and soft paths above (no browser e2e).

## 2. Package surface (`sku/runtime`)

- [ ] 2.1 Export Managed Data Mode APIs from `sku/runtime` (not a strategy-branded subpath). Drop `Ssr` from public type names.
- [ ] 2.2 Re-export shared runtime symbols from `sku/runtime` so Vite keeps one module identity (`SkuProvider`, insert-html helpers, site route registration, request-context runner).
- [ ] 2.3 Add `optimizeDeps.exclude` for `'sku'` and `'sku/runtime'` (shared constant). Assert it in unit tests.
- [ ] 2.4 Import `virtual:sku/polyfills` at the top of the SSR browser client entry only.

## 3. `routesEntry` and site-scoped trees

- [ ] 3.1 Add config `routesEntry` (default `src/routes.tsx`). Alias `__sku_alias__routesEntry` into both SSR graphs.
- [ ] 3.2 Export `SkuRouteObject = RouteObject & { sites?: string[] }`. Require named `routes` array. Hard-error when missing or non-array.
- [ ] 3.3 Soft-default empty/omitted config `sites` to `['default']`. Keep multi-site behaviour when `sites.length > 1`.
- [ ] 3.4 At init, pre-build one route tree per resolved site name. Omit `sites` ⇒ all sites. No parent→child inheritance. Strip `sites` before React Router.
- [ ] 3.5 Fail closed on missing/invalid/unknown site. Do not select the tree from config hosts.

## 4. Request entries and always-on `SkuProvider`

- [ ] 4.1 Types: `SkuServerEntry` / `SkuClientEntry`. Export zero-runtime `defineServerEntry` / `defineClientEntry` with sibling `NoInfer` typing.
- [ ] 4.2 Infer `Site` / `Language` / `ClientContext` / `ReactContext` from getter returns. `defineClientEntry<typeof server>` types client `site` / `clientContext` from the server entry.
- [ ] 4.3 Load server/client entries as default-exported objects. Call optional properties only.
- [ ] 4.4 Call order before `query()`: `getSite` → `getLanguage` → `getClientContext` → `getReactContext` → optional `getRouterContext`. Pass sibling values. Do not serialise `reactContext`.
- [ ] 4.5 Require `getSite` at init only when resolved sites length is `> 1`. Sole resolved site when omitted.
- [ ] 4.6 Always mount `SkuProvider` outside the router with `site` + `clientContext` + `reactContext`. No app-authored `Providers` export.
- [ ] 4.7 Export `createSkuContexts<typeof server, typeof client>()` with typed `useSite` / `useClientContext` / `useReactContext`.
- [ ] 4.8 Wire optional dual `getRouterContext` into `query({ requestContext })` and `createBrowserRouter({ getContext })`.
- [ ] 4.9 Optional `middleware` and `onHydrate`. Tolerate absent middleware in start and production.
- [ ] 4.10 Type-level / unit coverage for inference, omit paths, and sibling projection.

## 5. Start and build server runtime

- [ ] 5.1 `sku start` / `sku build`: Vite middlewareMode, sibling `client/` + `server/`, Document stream, document hydrate.
- [ ] 5.2 Resolve consumer entries via shared `__sku_alias__serverEntry` / `__sku_alias__clientEntry`.
- [ ] 5.3 Build `createStaticHandler` per site at init. Per request select handler and call only `query()` / `createStaticRouter`.
- [ ] 5.4 Abort-before-write. Forward loader/action Responses and headers. Errored-route `statusCode` + ErrorBoundary. `waitForAll`. `httpsDevServer`.
- [ ] 5.5 Skip `transformIndexHtml` on SSR. Manifest assets. Auto `moduleId` for lazy routes.
- [ ] 5.6 Mount `vitePluginSsrCss` on the SSR serve graph. Put the virtual stylesheet URL in Document `assets.css` on `sku start`.
- [ ] 5.7 Mount `telemetryPlugin` with `type: 'ssr'`. Deliver page-load + HMR clients via client entry / bootstrap.
- [ ] 5.8 Promise-scrub loader/action data. Strip production `Error.stack`. Harden Express→Fetch adapter.
- [ ] 5.9 Hydrate client from bootstrap `site` (same as SSR). Call optional `onHydrate({ clientContext })` only.

## 6. Assets, `publicPath`, and production layout

- [ ] 6.1 Treat `publicPath` as the static asset prefix only. Bake `__SKU_PUBLIC_PATH__`. Do not use Vite `BASE_URL` as React Router basename.
- [ ] 6.2 `sku start` ignores `publicPath` and serves Vite bootstrap from `/`. Production keeps `config.base` + assets under `publicPath`.
- [ ] 6.3 After client build, bake the Vite client manifest into the server output. Production entry loads the baked manifest without requiring sibling `client/`.
- [ ] 6.4 Mount `express.static(publicPath)` only when sibling `client/` exists, after request-context and before server-entry `middleware`. Omit the mount when absent.
- [ ] 6.5 Assert start HTML uses `/@vite/client` and prod HTML uses the configured prefix. Cover relative `/static/...` assets with app routes outside that prefix.

## 7. CSP

- [ ] 7.1 Shell CSP headers (enforcing and/or Report-Only). Lazy single nonce only when requested. Async Local Storage holds nonce only.
- [ ] 7.2 Align production defines with webpack (`__SKU_CSP__` object including report-only fields). Remove `import.meta.env.SKU_*` / `SKU_LANGUAGES`.
- [ ] 7.3 Consume `ReportingEndpoint` values from `createSkuContext`. Support `cspReportTo` on the enforcing policy. Emit `Reporting-Endpoints` for URL-bearing endpoints.
- [ ] 7.4 Cover CSP + report-only + report-to in fixture, e2e, and `buildCspHeaders` unit tests. Export `getCspNonce` from `sku/runtime`.

## 8. Vocab and language

- [ ] 8.1 Register language chunk only when `getLanguage` returns a language. No allowlist / sole-language default. No client forward of language.
- [ ] 8.2 When vocab / `languages` is active, resolve `@vocab/vite/runtime` from sku and alias the export file. Do not alias the package root.
- [ ] 8.3 Validate SSR + vocab without a consumer direct `@vocab/vite` dependency.

## 9. Streaming HTML insert + intent preload

- [ ] 9.1 Render-scoped injection queue + React context shared by `render` and `sku/runtime`. Provide it outermost around `Document`.
- [ ] 9.2 Export `useInsertHtml()` from `sku/runtime`. Silent no-op off the SSR path. Never throws.
- [ ] 9.3 Node transform on the response pipe writes queued markup before the next React chunk. Flush remainder at stream end. Works for `onShellReady` and `waitForAll`.
- [ ] 9.4 Register the selected site route tree from the client entry. Export `usePreloadRoute` from `sku/runtime` (both `lazy` shapes. No-op when unregistered + dev warning on client invoke).

## 10. `onListen`

- [ ] 10.1 Optional `onListen` on `SkuServerEntry` (`{ app, httpServer, port }` → `void | Promise<void>`).
- [ ] 10.2 Call once after middleware + HTML mounted and `listen` succeeds. Await promise. Failure fails startup. Do not re-call on server-entry HMR.
- [ ] 10.3 Tests: args shape, `expressTrustProxy` true/omit, `onListen` failure rejects startup.

## 11. Fixtures and tests

- [ ] 11.1 SSR fixture: streaming Suspense, default entry objects, middleware, CSP (+ report-only), document hydrate, multi-site `routes` + `sites`, ≥2 lazy route chunks, `createSkuContexts` hooks.
- [ ] 11.2 Translations fixture: SSR adapters with shared App + vocab. Cover `en` / `fr` / `en-PSEUDO`.
- [ ] 11.3 Fixture `stream-insert-html`: Apollo Client 4 + `buildManualDataTransport({ useInsertHtml })`. Mount via `getReactContext` + root layout `useReactContext`. GraphQL from server-entry `middleware`. Nonce on server scripts only.
- [ ] 11.4 E2E/smoke: shell-first stream, document hydration, HMR preamble, SSR-CSS link on start, telemetry wiring.
- [ ] 11.5 Tests: redirects, `waitForAll`, errored-route status, loader `Set-Cookie`, HTTPS start, missing export hard errors, nonce request/reuse, abort-before-write.
- [ ] 11.6 Tests: `devServerMiddleware` in start only. `onHydrate` receives `clientContext` only. Language chunk from `getLanguage` / omit. Auto `moduleId` preloads.
- [ ] 11.7 Tests: site filtering, soft-default `'default'`, fail-closed unknown site, foreign-site path does not match, catch-all middleware does not block assets under `publicPath`.
- [ ] 11.8 Tests: production server starts and streams without sibling `client/` when baked manifest is present. Dual-context / `sku/runtime` identity stays green under workspace link.
- [ ] 11.9 Fixture `PreloadingLink` on `usePreloadRoute`. Production hover warms lazy chunk. Foreign-site path does not warm.

## 12. Create template

- [ ] 12.1 `@sku-lib/create` template `ssr` with dual entry scaffold via `define*Entry` + `createSkuContexts`. Leave static `vite` unchanged.
- [ ] 12.2 Flatten layout: pathless root layout route, `ssrContext`, named `Component` on lazy pages. Omit config `sites` and `getSite` (soft-default). Set `expressTrustProxy: true`.
- [ ] 12.3 Update create generate tests and snapshots.

## 13. Docs and release

- [ ] 13.1 Product docs: Managed Data Mode vs SSR naming, entries, routing, providers/channels, data-loading, middleware, CSP, configuration, experimental warning.
- [ ] 13.2 Migrating: webpack dual-port → single `port`, `routesEntry`, getters, `onStart` → `onListen`, deploy layout, CJS interop docs, Jest → Vitest prerequisite.
- [ ] 13.3 Deploy docs: baked manifest / server without sibling `client/`. Recommended external assets. Standalone Node static as experimentation only. Runtime `node_modules` required.
- [ ] 13.4 Document unsupported SSR options (`public`, `dangerouslySetViteConfig`, `vitePlugins`, absolute `publicPath`). Document Express 4 + React Router 8 peer policy.
- [ ] 13.5 Changeset: experimental / not-for-production Managed Data Mode SSR. End-state public names. Do not label unreleased API churn as breaking.

## Deferred

See design Non-Goals and Resolved / deferred for the full list.
High-signal follow-ons only:

- Optional compose slot above the router if root layout + `getReactContext` prove insufficient
- Public language-in-React-context hook
- Generic `SkuRouteObject<Site>`
- Express 5 and React Router majors beyond 8 (later changes)
