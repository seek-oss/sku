## 1. Config and mode

- [x] 1.1 Add `buildType`; reject webpack + `ssr`, `-ssr` when set, absolute/`CDN` `publicPath`
- [x] 1.2 Vite SSR single-port: bake `__SKU_DEFAULT_SERVER_PORT__` from `port`; reject / untype `serverPort`; `PORT` still overrides at runtime
- [x] 1.3 Hard-error on Vite SSR `sku start` / `sku build` when configured `public` directory exists; message advises importing assets instead
- [x] 1.4 Disable Vite `publicDir` and `copyPublicFiles` for Vite SSR (static Vite / webpack unchanged)
- [x] 1.5 Add `react-router` for Vite SSR; fix `bundler` JSDoc so Vite is not described as static-only

## 2. Entries and runtime

- [x] 2.1 Require dual-entry `routes` + `onRequest` / `middleware` / `onHydrate` (hard errors on missing named exports; no noops; no early file-existence gate)
- [x] 2.2 Wire `AppWrapper`, server-local `language`, `clientContext` → `onHydrate({ context })`
- [x] 2.3 Mount server-entry `middleware` (start + prod); optional `devServerMiddleware` start-only before it
- [x] 2.4 `sku start` / `sku build`: middlewareMode, sibling `client/` + `server/`, Document stream, document hydrate
- [x] 2.5 Abort-before-write; forward loader/action Responses and headers; `statusCode` + ErrorBoundary; `waitForAll`; `httpsDevServer`
- [x] 2.6 Skip `transformIndexHtml` on SSR; manifest assets; auto `moduleId`; defer SSR-CSS / telemetry HTML inject
- [x] 2.7 Resolve consumer entries via shared `__sku_alias__serverEntry` / `__sku_alias__clientEntry` (same aliases as static Vite)
- [x] 2.8 Promise-scrub loader/action data; strip production `Error.stack`; harden Express→Fetch adapter (array headers; reconstruct body when stream consumed)

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
- [x] 5.3 Tests: redirects; `waitForAll`; errored-route status; loader `Set-Cookie`; HTTPS start; missing named-export hard errors; nonce request/reuse; abort-before-write
- [x] 5.4 Tests: `devServerMiddleware` in `sku start`; absent from production server bundle / responses
- [x] 5.5 Tests: `onHydrate` receives `context` only; no language in bootstrap / request-context; no public `getSkuLanguage`
- [x] 5.6 Tests: language chunk from `onRequest.language` / omit → no chunk; auto `moduleId` preloads; missing / non-array `routes` hard-error
- [x] 5.7 Fixture: intent preload via `PreloadingLink` + client `AppWrapper` routes context; production hover test for lazy chunk
- [x] 5.8 Unit tests for simplified language resolution and webpack-aligned production defines
- [x] 5.9 Config/command validation only for edge cases (webpack + `ssr`, `-ssr` with `buildType`, absolute/`CDN` `publicPath`, Vite SSR + `serverPort`, existing `public` directory) — no browser e2e
- [x] 5.10 Translations fixture: Vite SSR adapters (shared `App` + vocab; dedicated entries; `sku.config.vite-ssr.ts`) covering `en` / `fr` / `en-PSEUDO` via `?pseudo=true`

## 6. Create template

- [x] 6.1 `@sku-lib/create` `vite-ssr` template (`createRoutes` + dual `routes`); leave static `vite` unchanged
- [x] 6.2 Lazy pages use named `Component` (not default export); Migrating examples match

## 7. Docs and release

- [x] 7.1 Docs: `server-rendering.md` (+ Migrating), `vite.md`, `csp.md`, `configuration.md`, create READMEs; experimental / not-for-production warning
- [x] 7.2 Migrating: webpack dual-port → Vite SSR single `port`; `dist/server/server.js` + sibling `client/` / `server/` layout
- [x] 7.3 Document CJS interop for Vite SSR `sku start` + `__UNSAFE_EXPERIMENTAL__cjsInteropDependencies` (docs only; no runtime error rewrite; no new baked-in defaults)
- [x] 7.4 Discourage `public` for Vite SSR in product + `configuration.md`; Migrating calls out moving off the folder
- [x] 7.5 Prefer render-time data loading via `AppWrapper` + Suspense; loaders opt-in for waterfalls / document redirects / headers; no Express `req` → loader bridge
- [x] 7.6 Migrating: server-only loaders vs client route graph (+ explicit `moduleId` when needed); Braid reset-before-Braid on `sku start`; client-only / `onHydrate`-only providers for `window`; Jest → Vitest prerequisite; `#` pathAliases / migrate-root-resolution
- [x] 7.7 Drop “install `@vocab/vite` yourself” from product + Migrating once sku-owned alias is in place
- [x] 7.8 Document Express 4 (shared sku major) and React Router 8; note future major upgrades may be breaking (middleware + Data Mode); do not document Express 5 for this release
- [x] 7.9 Changeset: experimental / not-for-production; React Router 8; Express stays on 4; breaking-major policy for later upgrades; no Express 5 bump

## 8. Express 4 (keep) + React Router 8

- [x] 8.1 Revert any Express / `@types` 4 → 5 bump and Express 5-only API fixes in shared sku servers (webpack SSR path splat, type casts, etc.) so Express remains 4
- [x] 8.2 Upgrade catalog + Vite SSR fixtures/template `react-router` from 7 → 8; align peer baselines if required; fix Data Mode API breakage

## Deferred

- Production listen / custom logger — design Open Questions
- Runtime dual-`routes` validation — Non-Goals (docs only)
- Vite SSR support for config `public` / unhashed public assets — Non-Goals until definitive need
- Express 5 (sku-wide; webpack SSR + Vite SSR + `sku serve`) — later breaking change
- React Router majors beyond 8 — later releases; may be breaking
- Automatic `*.server.ts` client strip — Non-Goals (docs / convention only)
- Auto-inject Braid reset into sku Vite SSR server entry — Non-Goals (Braid optional; docs only)
- Express `req` → loader bridge / RR `requestContext` seeding — Non-Goals this change
