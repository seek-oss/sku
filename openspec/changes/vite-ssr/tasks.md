## 1. Config and mode

- [x] 1.1 Add `buildType`; reject webpack + `ssr`, `-ssr` when set, absolute/`CDN` `publicPath`
- [x] 1.2 Add `react-router` for Vite SSR; stop describing Vite SSR as unsupported

## 2. Entries and runtime

- [x] 2.1 Require dual-entry `routes` + `onRequest` / `middleware` / `onHydrate` (hard errors on missing named exports; no noops; no early file-existence gate)
- [x] 2.2 Wire `AppWrapper`, server-local `language`, `clientContext` → `onHydrate({ context })`
- [x] 2.3 Mount server-entry `middleware` (start + prod); optional `devServerMiddleware` start-only before it
- [x] 2.4 `sku start` / `sku build`: middlewareMode, sibling `client/` + `server/`, Document stream, document hydrate
- [x] 2.5 Abort-before-write; forward loader/action Responses and headers; `statusCode` + ErrorBoundary; `waitForAll`; `httpsDevServer`
- [x] 2.6 Skip `transformIndexHtml` on SSR; manifest assets; auto `moduleId`; defer SSR-CSS / telemetry HTML inject
- [x] 2.7 Shell CSP headers (enforcing and/or Report-Only); lazy single nonce only when requested; ALS holds nonce only
- [x] 2.8 Vocab: register only when `onRequest` returns `language`; no allowlist / sole-language default; no `addLanguageChunk` / client forward
- [x] 2.9 Promise-scrub loader/action data; strip production `Error.stack`; harden Express→Fetch adapter (array headers; reconstruct body when stream consumed)
- [x] 2.10 Align Vite SSR entry wrappers on `__sku_alias__serverEntry` / `__sku_alias__clientEntry` (drop `#sku-vite-ssr-*` aliases, ambient modules, and tsdown externals)
- [x] 2.11 Align production defines with webpack: `__SKU_DEFAULT_SERVER_PORT__` + `__SKU_CSP__` object (incl. report-only fields); remove `import.meta.env.SKU_*` / `SKU_LANGUAGES`
- [x] 2.12 Simplify language resolution: drop allowlist validation and sole-language fallback; register chunk only from `onRequest.language`

## 3. Fixtures and tests

- [x] 3.1 Vite SSR fixture: streaming Suspense, required entries/exports, middleware, CSP (+ report-only), document hydrate, vocab when configured, ≥2 distinct lazy route chunks
- [x] 3.2 E2E/smoke: shell-first stream, document hydration, HMR preamble
- [x] 3.3 Tests: redirects; `waitForAll`; errored-route status; loader `Set-Cookie`; HTTPS start; missing named-export hard errors; nonce request/reuse; abort-before-write
- [x] 3.4 Tests: `devServerMiddleware` in `sku start`; absent from production server bundle / responses
- [x] 3.5 Tests: `onHydrate` receives `context` only; no language in bootstrap / request-context; no public `getSkuLanguage`
- [x] 3.6 Tests: language chunk from `onRequest.language` / omit → no chunk; auto `moduleId` preloads; missing / non-array `routes` hard-error
- [x] 3.7 Do **not** add browser e2e for config edge cases (webpack + `ssr`, `-ssr` with `buildType`, absolute/`CDN` `publicPath`, Vite SSR + existing `public` directory) — those cases were removed from the browser suite; config/command validation is enough
- [x] 3.8 Update unit tests for simplified language resolution and webpack-aligned production defines
- [x] 3.9 Fixture: intent preload via `PreloadingLink` + client `AppWrapper` routes context; production hover test for lazy chunk

## 4. Create, docs, release

- [x] 4.1 `@sku-lib/create` `vite-ssr` template (`createRoutes` + dual `routes`); leave static `vite` unchanged
- [x] 4.2 Docs: `server-rendering.md` (+ Migrating), `vite.md`, `csp.md`, `configuration.md`, create READMEs; experimental / not-for-production warning
- [x] 4.3 Changeset marks Vite SSR experimental and not for production

## 5. Migration spike follow-ups

- [x] 5.1 Stop treating `publicPath` as React Router basename; bake `__SKU_PUBLIC_PATH__` (not Vite `BASE_URL`); fixture for relative `/static/...` assets with app routes outside that prefix
- [x] 5.2 Vite SSR single-port: bake `__SKU_DEFAULT_SERVER_PORT__` from `port`; reject / untype `serverPort`; docs + Migrating
- [x] 5.3 Align create `vite-ssr` template lazy pages to named `Component`; update Migrating examples (no default export)
- [x] 5.4 Document CJS interop for Vite SSR `sku start` + `__UNSAFE_EXPERIMENTAL__cjsInteropDependencies` (docs only; no runtime error rewrite; no new baked-in interop defaults)
- [x] 5.5 Fix `bundler` JSDoc (Vite not static-only); align Express `@types` with Vite SSR runtime and document supported Express major
- [x] 5.6 Migrating docs: webpack dual-port → Vite SSR single `port` (drop `serverPort`; `PORT` overrides), `dist/server/server.js` + sibling `client/` / `server/` layout
- [x] 5.7 `sku start` ignores `publicPath` and serves Vite bootstrap from `/` (webpack SSR start parity); `sku build` / production keep `config.base` + static assets under `publicPath`; assert start HTML uses `/@vite/client` and prod HTML uses the configured prefix

## 6. Reject public assets folder for Vite SSR

- [x] 6.1 Hard-error on Vite SSR `sku start` / `sku build` when configured `public` directory exists; message advises importing assets instead
- [x] 6.2 Disable Vite `publicDir` and `copyPublicFiles` for Vite SSR (static Vite / webpack unchanged)
- [x] 6.3 Config/command validation test for existing `public` directory (no browser e2e)
- [x] 6.4 Docs: discourage `public` for Vite SSR in product + `configuration.md`; Migrating calls out moving off the folder

## 7. Translations fixture: Vite SSR coverage

- [x] 7.1 Add Vite SSR adapters to `fixtures/translations` (shared `App` + vocab; dedicated `clientEntry`/`serverEntry`; `sku.config.vite-ssr.ts` with `bundler: 'vite'`, `buildType: 'ssr'`, relative `publicPath`, distinct `target`/`port`)
- [x] 7.2 Cover the same SSR scenarios as webpack translations SSR: `en`, `fr`, and `en-PSEUDO` via `?pseudo=true` (app snapshots; kitchen-sink vocab plumbing stays as-is)
- [x] 7.3 Add fixture scripts / `react-router` dep as needed so `pnpm fixture translations` can run the Vite SSR mode

## 8. Pre-release Express 5 + React Router 8

- [x] 8.1 Upgrade Vite SSR Express runtime and `@types` from 4 → 5; fix any Express 5 API breakage in sku server / adapters
- [x] 8.2 Upgrade catalog + Vite SSR fixtures/template `react-router` from 7 → 8; align peer baselines sku owns if required; fix Data Mode API breakage
- [x] 8.3 Docs + Migrating: state Express 5 and React Router 8; note that future Express / React Router major upgrades may be breaking (middleware + Data Mode integration)
- [x] 8.4 Changeset: call out Express 5 + React Router 8 for Vite SSR and the breaking-major policy for later upgrades

## 9. Trial-migration Migrating docs follow-ups

- [x] 9.1 Migrating (Older SSR): remind readers to keep server-only loader modules off the client-imported route graph; note split trees and explicit `handle.moduleId` when lazy factories are non-idiomatic
- [x] 9.2 Migrating / product: for Braid apps, document reset-before-Braid on `sku start` (start evaluation order can differ from production); do not auto-inject reset into sku’s server entry
- [x] 9.3 Migrating: remind readers that providers touching `window` must not run in the Document SSR tree (client-only / `onHydrate`-only wrappers)
- [x] 9.4 Migrating: call out Jest → Vitest as a Vite SSR prerequisite; link existing Vitest docs / `@sku-lib/codemod jest-to-vitest` (no new codemod)
- [x] 9.5 Migrating / Vocab: drop “install `@vocab/vite` yourself” once sku-owned alias is proven (see §10; supersedes prior direct-dep docs)
- [x] 9.6 Migrating: point bare `src/…` / webpack `baseUrl` imports at `#` `pathAliases` and migrate-root-resolution guidance

## 10. Sku-owned `@vocab/vite` resolve

- [x] 10.1 When vocab / `languages` is active: resolve `@vocab/vite/runtime` from sku via `createRequire(import.meta.url)` and alias it to the export file in shared Vite `resolve.alias` (`packages/sku/src/services/vite/plugins/config.ts`); do not alias the `@vocab/vite` package root
- [x] 10.2 Validate Vite SSR with vocab (e.g. translations fixture) **without** a consumer direct `@vocab/vite` dependency
- [x] 10.3 Drop “install `@vocab/vite` yourself” from product + Migrating docs in `server-rendering.md` (completes 9.5)

## Deferred

- Production listen / custom logger — design Open Questions
- Runtime dual-`routes` validation — Non-Goals (docs only)
- Vite SSR support for config `public` / unhashed public assets — Non-Goals until definitive need
- Express / React Router majors beyond 5 / 8 — later releases; may be breaking per design §19–20
- Automatic `*.server.ts` client strip — Non-Goals (docs / convention only)
- Auto-inject Braid reset into sku Vite SSR server entry — Non-Goals (Braid optional; docs only)
