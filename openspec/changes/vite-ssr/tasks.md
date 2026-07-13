## 1. Viability spike

- [x] 1.1 Spike Vite SSR + React Router Data Mode (`createStaticHandler` → Document `renderToPipeableStream` → `hydrateRoot(document)`) with one lazy route
- [x] 1.2 Spike shell-derived CSP HTTP headers + request nonce + hashable bootstrap script body on the streamed response
- [x] 1.3 Spike no-`transformIndexHtml` path: preamble import + `bootstrapModules` + Document assets; confirm HMR
- [x] 1.4 Confirm React 18 vs 19 `hydrateRoot(document)` + `<html>` doctype behavior; record gate in `design.md` if React ≥ 19 required
- [x] 1.5 Record spike outcomes against open questions in `design.md` (app entry name, Document ownership, middleware typing, `onAllReady` API, omitted-`renderType` default)

## 2. Public API and config

- [x] 2.1 Add `renderType: 'server-side-rendered' | 'static-generated'` to sku config (default preserves today’s static behavior)
- [x] 2.2 Reject `bundler: 'webpack'` + `renderType: 'server-side-rendered'` with a clear error
- [x] 2.3 Reject `sku start-ssr` / `sku build-ssr` when `renderType` is set; point consumers to `sku start` / `sku build`
- [x] 2.4 Add Vite SSR app module types/config (`SkuApp`, app entry path, CSP report-only options)
- [x] 2.5 Detect Vite SSR via `bundler: 'vite'` + `renderType: 'server-side-rendered'` + app module; keep webpack SSR / static paths unchanged otherwise
- [x] 2.6 Add `react-router` (Data Mode) as the sku-managed dependency for Vite SSR
- [x] 2.7 Update bundler validation so Vite SSR is no longer described as “SSR only supported with Webpack” when `renderType` is in play

## 3. Core Vite SSR runtime

- [x] 3.1 Wire `sku start` for Vite SSR (single-port Vite `middlewareMode` + `appType: 'custom'` + sku render middleware)
- [x] 3.2 Wire `sku build` for Vite SSR (sibling `client/` + `server/` under the build target; client manifest + runnable Node server entry; neither nested in the other)
- [x] 3.3 Implement default Document + streaming render (`onShellReady`; optional `onAllReady` buffering per design decision)
- [x] 3.4 Pass `bootstrapModules` and hashable `bootstrapScriptContent`; abort render on client disconnect
- [x] 3.5 Implement per-route async chunk loading for SSR + hydration
- [x] 3.6 Mount consumer middleware before sku’s HTML render path
- [x] 3.7 Ensure streaming SSR responses do not call `transformIndexHtml`; keep `index.html` discovery-only if present

## 4. Assets, client entry, plugin parity

- [x] 4.1 Streaming client wrapper: preamble import + `hydrateRoot(document, …)` with serialized assets/context
- [x] 4.2 Production asset resolver (manifest → CSS + modulepreloads) feeding Document + client serialization
- [x] 4.3 Reimplement or explicitly defer SSR-CSS and telemetry behaviors that today rely only on `transformIndexHtml`
- [x] 4.4 Keep static Vite `#app` hydrate / `transformIndexHtml` path unchanged

## 5. CSP for Vite SSR

- [x] 5.1 Generate enforcing CSP from shell HTML + nonces/hashes as `Content-Security-Policy` headers
- [x] 5.2 Support Report-Only CSP (`Content-Security-Policy-Report-Only`), alone or alongside enforcing
- [x] 5.3 Ensure Vite SSR does not use meta `http-equiv` CSP delivery; leave static/webpack CSP behavior unchanged
- [x] 5.4 Support configurable `report-to` on Report-Only CSP via `cspReportOnlyReportTo`

## 6. Fixtures, docs, release

- [x] 6.1 Add a Vite SSR fixture covering `renderType`, full-document streaming Suspense, lazy routes, middleware, document hydrate, and CSP headers (incl. report-only)
- [x] 6.2 E2E/dev smoke: shell-first streaming, successful document hydration, no missing-preamble HMR failure; assert webpack+`server-side-rendered` and `-ssr`+`renderType` errors
- [x] 6.3 Update `docs/docs/vite.md` for Vite SSR (`renderType`, `sku start`/`build`, app module, streaming vs static)
- [x] 6.4 Update `docs/docs/server-rendering.md` for Vite SSR vs webpack SSR (high-level app API, document hydrate)
- [x] 6.5 Update `docs/docs/csp.md` for Vite SSR header CSP, nonces, report-only, and relative-`publicPath`-only
- [x] 6.6 Update `docs/docs/configuration.md` for `renderType`, `appEntry`, CSP report-only options, and Vite SSR relative-`publicPath` constraint
- [x] 6.7 Update plop/`@sku-lib/create` templates if applicable
- [x] 6.8 Add a changeset (release notes) for `renderType` / Vite SSR public API that **references each** of: `vite.md`, `server-rendering.md`, `csp.md`, `configuration.md`

## 7. Vocab chunks and per-route chunk fixture (required)

- [x] 7.1 Register the active language vocab chunk on the Vite SSR Document asset path (`getChunkName(language)` / `@vocab/vite/chunks`), parity with static Vite and webpack SSR
- [x] 7.2 Confirm Vite SSR builds keep `@vocab/vite` `createVocabChunks` language splitting for client (and server as needed)
- [x] 7.3 Add or extend a fixture that **demonstrates** per-route async chunking (≥2 lazy routes → distinct client chunks; SSR + hydrate)
- [x] 7.4 Tests/assertions: language chunk registered/preloaded for a multi-language Vite SSR request; distinct per-route chunks from the demo fixture
- [x] 7.5 Docs: note Vite SSR vocab/language chunks and the per-route chunking fixture/pattern where relevant (`server-rendering.md` / `vite.md`)

## 8. Post-review hardening (CSP, safety, tests)

- [x] 8.1 Remove Vite SSR absolute/`CDN` `publicPath` support added earlier (CSP origin injection, absolute static-mount special cases); reject absolute `publicPath` for Vite SSR with a clear error; keep relative mount + `'self'` CSP
- [x] 8.2 Strip `Error.stack` from hydration bootstrap serialization in production
- [x] 8.3 Apply promise-scrubbing to `actionData` as well as `loaderData`
- [x] 8.4 Unify dev HTML path on shared middleware / abort-before-write (match production)
- [x] 8.5 Expose per-request CSP nonce to middleware/loaders; update CSP docs so Vite SSR is not documented only via webpack `createUnsafeNonce`
- [x] 8.6 Warn in development on missing/unknown lazy-route `handle.moduleId`; document the v1 contract
- [x] 8.7 Tests: absolute `publicPath` rejected for Vite SSR; loader redirect `Response`; `handle.waitForAll`; errored route (no stack in prod payload); React < 19 gate; lazy-route modulepreload; client disconnect/abort
- [x] 8.8 Remove accidental fixture noise (`lint-format` junk file; unintended `.gitignore` / `.prettierignore` churn on unrelated fixtures)

## 9. Auto-derive lazy-route moduleId (Option A)

- [x] 9.1 Vite SSR transform: inject `handle.moduleId` for `lazy: () => import('…')` (single string literal); reuse loadable path-resolution approach; SSR env; never overwrite explicit `moduleId`; never rewrite `lazy` body
- [x] 9.2 Skip non-idiomatic shapes (multi-import, granular `lazy` object, indirect bindings) without guessing
- [x] 9.3 Update `fixtures/vite-ssr` to drop hand-written `handle.moduleId` on idiomatic lazy routes; keep assertions that modulepreloads still emit
- [x] 9.4 Unit/transform tests for inject / skip / preserve-explicit cases
- [x] 9.5 Docs: prefer auto-derive; document escape hatch + skipped shapes; remove “auto-derive not in v1” wording

## 10. Request-scoped nonce (lazy, single value)

- [x] 10.1 Stop always-minting a CSP nonce in Vite SSR request middleware; mint at most one value only when explicitly requested (`getCspNonce` / Express `req.getCspNonce()` or equivalent)
- [x] 10.2 Include `'nonce-…'` in CSP headers only if a nonce was requested for that response; sku requests only when attaching nonce to scripts
- [x] 10.3 Update `docs/docs/csp.md` for the single request-scoped nonce contract vs static/webpack multi-`createUnsafeNonce`
- [x] 10.4 Tests: CSP without nonce when never requested; same nonce reused when requested; header includes nonce only after request

## 11. App-owned language identification (request slot)

- [x] 11.1 Add a documented Vite SSR request language slot (namespaced `req.skuLanguage` and/or ALS helper mirroring CSP nonce) that accepts a configured language **name**
- [x] 11.2 Resolve active language in order: request slot → `:language` param → sole configured language; soft-fail (skip chunk registration) otherwise; validate against configured `languages` + `en-PSEUDO`; do **not** use `handle.language`
- [x] 11.3 Prefer the request slot over `:language` when both are present (including composed locales like `th-TH` vs URL prefix `th`)
- [x] 11.4 Tests: middleware-set language registers the correct chunk; slot wins over `:language`; unknown/missing language soft-fails
- [x] 11.5 Docs: document the request language slot as the preferred identification path; keep `:language` / sole-language as convenience fallbacks; note value must match `languages` names (not URL segments); note `handle.language` is not used

## 12. Remove consumer Document override

- [x] 12.1 Remove `SkuApp.document` / `DocumentProps` from the public Vite SSR API; always use sku’s Document on server and client render paths
- [x] 12.2 Update docs (`configuration.md`, `server-rendering.md`, `vite.md`, etc.) so they no longer describe an optional Document override
- [x] 12.3 Ensure fixture and tests do not export or rely on a custom `document`; keep full-document hydrate coverage intact

## 13. Post-review hardening (headers, HTTPS, adapter, tests)

- [x] 13.1 Forward `context.loaderHeaders` / `context.actionHeaders` onto streamed HTML responses (append; preserve `Set-Cookie`); keep sku-owned `Content-Type` / CSP
- [x] 13.2 Wire `httpsDevServer` for Vite SSR `createDevSsrServer` (shared `createServer` + HMR on the HTTPS listener; URL printer stays truthful)
- [x] 13.3 Harden Express→Fetch `createWebRequest` (normalize array headers; reconstruct body when the request stream was already consumed)
- [x] 13.4 Tests: loader `Set-Cookie` on HTML response; errored route non-2xx status; Playwright (or equivalent) document hydration smoke
- [x] 13.5 Tests: Vite SSR `httpsDevServer: true` accepts HTTPS and returns a document
- [x] 13.6 Docs: `SkuApp.middleware` vs config `devServerMiddleware` for Vite SSR; note `httpsDevServer` works for Vite SSR `sku start`

## Deferred (no tasks)

- Production listen / setup logging and a custom logger for setup behaviours (e.g. listen-on-port) — documented in `design.md` Open Questions / §9; no implementation in this change.
