## 1. Viability spike

- [ ] 1.1 Spike Vite SSR + React Router Data Mode (`createStaticHandler` → Document `renderToPipeableStream` → `hydrateRoot(document)`) with one lazy route
- [ ] 1.2 Spike shell-derived CSP HTTP headers + request nonce + hashable bootstrap script body on the streamed response
- [ ] 1.3 Spike no-`transformIndexHtml` path: preamble import + `bootstrapModules` + Document assets; confirm HMR
- [ ] 1.4 Confirm React 18 vs 19 `hydrateRoot(document)` + `<html>` doctype behavior; record gate in `design.md` if React ≥ 19 required
- [ ] 1.5 Record spike outcomes against open questions in `design.md` (app entry name, Document ownership, middleware typing, `onAllReady` API, omitted-`renderType` default)

## 2. Public API and config

- [ ] 2.1 Add `renderType: 'server-side-rendered' | 'static-generated'` to sku config (default preserves today’s static behavior)
- [ ] 2.2 Reject `bundler: 'webpack'` + `renderType: 'server-side-rendered'` with a clear error
- [ ] 2.3 Reject `sku start-ssr` / `sku build-ssr` when `renderType` is set; point consumers to `sku start` / `sku build`
- [ ] 2.4 Add Vite SSR app module types/config (`SkuApp`, app entry path, CSP report-only options)
- [ ] 2.5 Detect Vite SSR via `bundler: 'vite'` + `renderType: 'server-side-rendered'` + app module; keep webpack SSR / static paths unchanged otherwise
- [ ] 2.6 Add `react-router` (Data Mode) as the sku-managed dependency for Vite SSR
- [ ] 2.7 Update bundler validation so Vite SSR is no longer described as “SSR only supported with Webpack” when `renderType` is in play

## 3. Core Vite SSR runtime

- [ ] 3.1 Wire `sku start` for Vite SSR (single-port Vite `middlewareMode` + `appType: 'custom'` + sku render middleware)
- [ ] 3.2 Wire `sku build` for Vite SSR (sibling `client/` + `server/` under the build target; client manifest + runnable Node server entry; neither nested in the other)
- [ ] 3.3 Implement default Document + streaming render (`onShellReady`; optional `onAllReady` buffering per design decision)
- [ ] 3.4 Pass `bootstrapModules` and hashable `bootstrapScriptContent`; abort render on client disconnect
- [ ] 3.5 Implement per-route async chunk loading for SSR + hydration
- [ ] 3.6 Mount consumer middleware before sku’s HTML render path
- [ ] 3.7 Ensure streaming SSR responses do not call `transformIndexHtml`; keep `index.html` discovery-only if present

## 4. Assets, client entry, plugin parity

- [ ] 4.1 Streaming client wrapper: preamble import + `hydrateRoot(document, …)` with serialized assets/context
- [ ] 4.2 Production asset resolver (manifest → CSS + modulepreloads) feeding Document + client serialization
- [ ] 4.3 Reimplement or explicitly defer SSR-CSS and telemetry behaviors that today rely only on `transformIndexHtml`
- [ ] 4.4 Keep static Vite `#app` hydrate / `transformIndexHtml` path unchanged

## 5. CSP for Vite SSR

- [ ] 5.1 Generate enforcing CSP from shell HTML + nonces/hashes as `Content-Security-Policy` headers
- [ ] 5.2 Support Report-Only CSP (`Content-Security-Policy-Report-Only`), alone or alongside enforcing
- [ ] 5.3 Ensure Vite SSR does not use meta `http-equiv` CSP delivery; leave static/webpack CSP behavior unchanged

## 6. Fixtures, docs, release

- [ ] 6.1 Add a Vite SSR fixture covering `renderType`, full-document streaming Suspense, lazy routes, middleware, document hydrate, and CSP headers (incl. report-only)
- [ ] 6.2 E2E/dev smoke: shell-first streaming, successful document hydration, no missing-preamble HMR failure; assert webpack+`server-side-rendered` and `-ssr`+`renderType` errors
- [ ] 6.3 Update `docs/docs/vite.md` for Vite SSR (`renderType`, `sku start`/`build`, app module, streaming vs static)
- [ ] 6.4 Update `docs/docs/server-rendering.md` for Vite SSR vs webpack SSR (high-level app API, document hydrate)
- [ ] 6.5 Update `docs/docs/csp.md` for Vite SSR header CSP, nonces, report-only, and relative-`publicPath`-only
- [ ] 6.6 Update `docs/docs/configuration.md` for `renderType`, `appEntry`, CSP report-only options, and Vite SSR relative-`publicPath` constraint
- [ ] 6.7 Update plop/`@sku-lib/create` templates if applicable
- [ ] 6.8 Add a changeset (release notes) for `renderType` / Vite SSR public API that **references each** of: `vite.md`, `server-rendering.md`, `csp.md`, `configuration.md`

## 7. Post-review hardening (CSP, safety, tests)

- [ ] 7.1 Remove Vite SSR absolute/`CDN` `publicPath` support added earlier (CSP origin injection, absolute static-mount special cases); reject absolute `publicPath` for Vite SSR with a clear error; keep relative mount + `'self'` CSP
- [ ] 7.2 Strip `Error.stack` from hydration bootstrap serialization in production
- [ ] 7.3 Apply promise-scrubbing to `actionData` as well as `loaderData`
- [ ] 7.4 Unify dev HTML path on shared middleware / abort-before-write (match production)
- [ ] 7.5 Expose per-request CSP nonce to middleware/loaders; update CSP docs so Vite SSR is not documented only via webpack `createUnsafeNonce`
- [ ] 7.6 Warn in development on missing/unknown lazy-route `handle.moduleId`; document the v1 contract
- [ ] 7.7 Tests: absolute `publicPath` rejected for Vite SSR; loader redirect `Response`; `handle.waitForAll`; errored route (no stack in prod payload); React < 19 gate; lazy-route modulepreload; client disconnect/abort
- [ ] 7.8 Remove accidental fixture noise (`lint-format` junk file; unintended `.gitignore` / `.prettierignore` churn on unrelated fixtures)
