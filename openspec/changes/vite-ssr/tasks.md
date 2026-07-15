## 1. Config and mode

- [x] 1.1 Add `renderType`; reject webpack + `server-side-rendered`, `-ssr` when set, absolute/`CDN` `publicPath`
- [x] 1.2 Add `react-router` for Vite SSR; stop describing Vite SSR as unsupported

## 2. Entries and runtime

- [x] 2.1 Require dual-entry `routes` + `onRequest` / `middleware` / `onHydrate` (hard errors; no noops)
- [x] 2.2 Wire `AppWrapper`, server-local `language`, `clientContext` → `onHydrate({ context })`
- [x] 2.3 Mount server-entry `middleware` (start + prod); optional `devServerMiddleware` start-only before it
- [x] 2.4 `sku start` / `sku build`: middlewareMode, sibling `client/` + `server/`, Document stream, document hydrate
- [x] 2.5 Abort-before-write; forward loader/action Responses and headers; `statusCode` + ErrorBoundary; `waitForAll`; `httpsDevServer`
- [x] 2.6 Skip `transformIndexHtml` on SSR; manifest assets; auto `moduleId`; defer SSR-CSS / telemetry HTML inject
- [x] 2.7 Shell CSP headers (enforcing and/or Report-Only); lazy single nonce only when requested; ALS holds nonce only
- [x] 2.8 Vocab: register from `onRequest` `language` → sole language → soft-fail; no `addLanguageChunk` / client forward
- [x] 2.9 Promise-scrub loader/action data; strip production `Error.stack`; harden Express→Fetch adapter (array headers; reconstruct body when stream consumed)

## 3. Fixtures and tests

- [x] 3.1 Vite SSR fixture: streaming Suspense, required entries/exports, middleware, CSP (+ report-only), document hydrate, vocab when configured, ≥2 distinct lazy route chunks
- [x] 3.2 E2E/smoke: shell-first stream, document hydration, HMR preamble; webpack + `server-side-rendered` and `-ssr` + `renderType` errors
- [x] 3.3 Tests: absolute `publicPath` rejected; redirects; `waitForAll`; errored-route status; loader `Set-Cookie`; HTTPS start; missing entry/export hard errors; nonce request/reuse; abort-before-write
- [x] 3.4 Tests: `devServerMiddleware` in `sku start`; absent from production server bundle / responses
- [x] 3.5 Tests: `onHydrate` receives `context` only; no language in bootstrap / request-context; no public `getSkuLanguage`
- [x] 3.6 Tests: language chunk registration / sole-language / soft-fail; auto `moduleId` preloads; missing / non-array `routes` hard-error

## 4. Create, docs, release

- [x] 4.1 `@sku-lib/create` `vite-ssr` template (`createRoutes` + dual `routes`); leave static `vite` unchanged
- [x] 4.2 Docs: `server-rendering.md` (+ Migrating), `vite.md`, `csp.md`, `configuration.md`, create READMEs; React 19+; experimental / not-for-production warning
- [x] 4.3 Changeset marks Vite SSR experimental and not for production

## Deferred

- Production listen / custom logger — design Open Questions
- Runtime dual-`routes` validation — Non-Goals (docs only)
