## 1. Config and mode selection

- [x] 1.1 Add `renderType: 'server-side-rendered' | 'static-generated'` (omit preserves today’s static default)
- [x] 1.2 Reject `bundler: 'webpack'` + `renderType: 'server-side-rendered'`
- [x] 1.3 Reject `sku start-ssr` / `sku build-ssr` when `renderType` is set; point to `sku start` / `sku build`
- [x] 1.4 Reject absolute / CDN `publicPath` for Vite SSR (relative only)
- [x] 1.5 Add `react-router` (Data Mode) as the sku-managed dependency for Vite SSR
- [x] 1.6 Update bundler validation so Vite SSR is no longer described as “SSR only supported with Webpack”

## 2. Routes and request entries

- [x] 2.1 Add `routesEntry` (default `src/routes.tsx`) exporting named `routes: RouteObject[]`; no `SkuApp` / `appEntry`
- [x] 2.2 Reuse `serverEntry` / `clientEntry` (defaults `src/server.tsx` / `src/client.tsx`) for Vite SSR named exports; no `entryServer` / `entryClient`
- [x] 2.3 Require named exports: `routes`, `onRequest`, `middleware`, `onHydrate` — hard error if file or export missing; no soft-skip / default / sku noops
- [x] 2.4 Wire `onRequest` before `query()`: mount optional `AppWrapper` as pathless parent under the router; seed language; serialise shell-time `clientContext`
- [x] 2.5 Wire `onHydrate` with deserialized `context` + forwarded `language`; mount client `AppWrapper` the same way
- [x] 2.6 Mount server-entry `middleware` before HTML render (not routes entry). Keep `middleware` required (empty/passthrough OK)
- [x] 2.7 Language identity only via server `onRequest` `language` → sole-language fallback → soft-fail; no `req.skuLanguage` / `:language` / `handle.language`

## 3. Core Vite SSR runtime

- [x] 3.1 Wire `sku start` (single-port Vite `middlewareMode` + `appType: 'custom'` + sku HTML middleware)
- [x] 3.2 Wire `sku build` (sibling `client/` + `server/` under build target; neither nested)
- [x] 3.3 Implement sku-owned Document + `renderToPipeableStream` (`onShellReady`; optional `handle.waitForAll` → `onAllReady`)
- [x] 3.4 Pass `bootstrapModules` + hashable `bootstrapScriptContent`; document-level `hydrateRoot(document)`
- [x] 3.5 Abort in-flight render on client disconnect; shared abort-before-write middleware in dev and prod
- [x] 3.6 Forward loader/action `Response` short-circuits; forward `loaderHeaders` / `actionHeaders` on HTML responses
- [x] 3.7 Errored routes: stream with `context.statusCode` + nearest `ErrorBoundary` (no sku error-page API)
- [x] 3.8 Support `httpsDevServer` on the Vite SSR single-port dev server (HTTPS + HMR)

## 4. Assets and plugin parity

- [x] 4.1 Skip `transformIndexHtml` on SSR responses; preamble via client entry; CSS/modulepreloads via Document assets
- [x] 4.2 Production asset resolver (manifest → CSS + modulepreloads) for Document + hydrate identity
- [x] 4.3 Defer SSR-CSS plugin / telemetry HTML inject for Vite SSR (documented); keep static Vite path unchanged
- [x] 4.4 Auto-derive `handle.moduleId` for idiomatic `lazy: () => import('…')`; preserve explicit; skip non-idiomatic; warn in dev on miss

## 5. CSP

- [x] 5.1 Shell-derived enforcing CSP as `Content-Security-Policy` headers (no meta `http-equiv`)
- [x] 5.2 Report-Only CSP (+ optional `cspReportOnlyReportTo`); may coexist with enforcing
- [x] 5.3 Lazy single request-scoped nonce (`getCspNonce` / `req.getCspNonce()`); mint only when requested; include `'nonce-…'` in CSP only if requested
- [x] 5.4 Relative `publicPath` + `'self'` for Document assets; `cspExtraScriptSrcHosts` for third-party only

## 6. Vocab and per-route chunks

- [x] 6.1 Keep `@vocab/vite` language chunk splitting in Vite SSR builds
- [x] 6.2 Register active language chunk on Document assets via server entry `language` (sku-owned registration; no `addLanguageChunk`)
- [x] 6.3 Fixture demonstrating ≥2 distinct lazy route chunks (SSR + hydration)
- [x] 6.4 Tests: language chunk registration / sole-language / soft-fail; distinct per-route chunks; auto `moduleId` preloads

## 7. Hydration safety and adapter

- [x] 7.1 Promise-scrub `loaderData` and `actionData` before bootstrap stringify
- [x] 7.2 Strip `Error.stack` from production hydration error payloads
- [x] 7.3 Harden Express→Fetch adapter (array headers; reconstruct body when stream already consumed)

## 8. Fixtures and tests

- [x] 8.1 Vite SSR fixture: streaming Suspense, required entries/named exports, middleware, CSP (+ report-only), document hydrate, vocab when configured
- [x] 8.2 E2E/smoke: shell-first stream, document hydration, HMR preamble; webpack+`server-side-rendered` and `-ssr`+`renderType` errors
- [x] 8.3 Tests: absolute `publicPath` rejected; redirects; `waitForAll`; errored-route status; loader `Set-Cookie`; HTTPS start; missing entry/export hard errors; nonce request/reuse; abort-before-write

## 9. Docs and release

- [x] 9.1 Update `vite.md`, `csp.md`, `configuration.md` for Vite SSR (`renderType`, routes/request entries, React 19+, relative `publicPath`, CSP nonce, vocab, auto `moduleId`)
- [x] 9.2 Flesh out primary Vite SSR section in `server-rendering.md` (providers/`AppWrapper`, middleware, CSP, response headers, error pages, create template)
- [x] 9.3 Add `## Migrating` with **Migrate from Static App** and **Migrate from Older SSR App** (self-contained; requirements/limitations up front; topic headers); link from `vite.md`; not under `docs/migration-guides/`
- [x] 9.4 Update create READMEs for the `vite-ssr` template
- [x] 9.5 Changeset referencing the public API, React 19+, create template, Migrating sections, and the docs above

## 10. `@sku-lib/create` Vite SSR template

- [x] 10.1 Add `vite-ssr` template to CLI `--template` and interactive choices (distinct from static `vite`)
- [x] 10.2 Scaffold: `bundler: 'vite'`, `renderType: 'server-side-rendered'`, relative `publicPath`, `src/routes.tsx` / `server.tsx` / `client.tsx` with required named exports + ≥1 idiomatic lazy route
- [x] 10.3 Wire package.json / install / generators (React 19+, Vitest where appropriate); leave static `vite` / `webpack` templates unchanged
- [x] 10.4 Tests: `--template vite-ssr` emits required config + named exports; static `vite` does not set `renderType: 'server-side-rendered'`

## Deferred (no tasks)

- Production listen / setup logging and a custom logger for setup behaviours — see `design.md` Open Questions; not implemented in this change.

## 11. Vite SSR `devServerMiddleware`

- [x] 11.1 Mount config `devServerMiddleware` in Vite SSR `sku start` before server-entry `middleware` (request-context → dev → prod → Vite → HTML)
- [x] 11.2 Ensure production server entry/build never imports `devServerMiddleware`
- [x] 11.3 Fixture/test: mock route served by `devServerMiddleware` in start; absent from production server bundle / responses
- [x] 11.4 Docs: reverse “don’t use for Vite SSR” guidance in `server-rendering.md` / `configuration.md`; document two-layer split + mount order; update Migrating Older SSR notes if needed

## 12. Language off request-context

- [x] 12.1 Remove language from SSR request-context store (`getLanguage` / `setLanguage`); keep ALS for CSP nonce only
- [x] 12.2 Pass `onRequest` `language` as a local into module-id / vocab preload resolution (do not read language via ALS)
- [x] 12.3 Remove public `getSkuLanguage` export; drop related tests
- [x] 12.4 Update `server-rendering.md` (and any other docs) that tell loaders to use `getSkuLanguage()`

## 13. Language not forwarded to client

- [x] 13.1 Drop `__SKU_LANGUAGE__` from hydrate bootstrap; stop passing `language` into `onHydrate`
- [x] 13.2 Narrow `SkuSsrOnHydrate` / client types to `{ context }` only; remove window language typing
- [x] 13.3 Update docs (`server-rendering.md`, `configuration.md`, etc.): `onHydrate` gets `context` only; client locale via re-derive / providers / optional `clientContext`
- [x] 13.4 Update bootstrap / hydrate tests and any create-template notes that mention hydrate `language`
