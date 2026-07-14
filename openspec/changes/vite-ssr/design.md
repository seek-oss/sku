## Context

Vite SSR commands are blocked today. Webpack SSR uses a low-level Express `renderCallback`, `@loadable` extraction, dual-port dev proxy, and CSP as `<meta http-equiv>`. Vite already has an internal `ssr` environment, but only for static prerender of `renderEntry` (string HTML → `transformIndexHtml` → `res.end`).

This change introduces a **Vite-only SSR product** selected by sku config `renderType`. sku owns the server, React document shell, streaming, bootstrap/assets (without `transformIndexHtml` on the SSR path), and CSP headers; React Router Data Mode provides routing, loaders/actions, and Suspense-friendly data.

Reference: [basic-streaming-app-example](https://github.com/jahredhope/basic-streaming-app-example). Spike outcomes validated the stack (middlewareMode + Data Mode → Document stream → `hydrateRoot(document)`, preamble without `transformIndexHtml`, shell CSP headers).

## Goals / Non-Goals

**Goals:**

- Select SSR vs static via `renderType: 'server-side-rendered' | 'static-generated'`
- High-level routes entry (`RouteObject[]`) plus required server/client request entries
- Full-document React root with shell-first streaming and document-level hydration
- Explicit asset/bootstrap story (no `transformIndexHtml` on the stream path)
- Shell-derived CSP as HTTP headers (lazy single nonce, optional Report-Only)
- Per-route async chunks + vocab/language chunk registration
- `@sku-lib/create` Vite SSR template + Migrating sections in `server-rendering.md`

**Non-Goals:**

- New SSR mode on webpack; changing webpack `start-ssr` / `build-ssr` when `renderType` is unset
- Webpack-SSR create template; converting the static `vite` create template into SSR
- Vite SSR migration pages under `docs/migration-guides/`
- React Router Framework Mode / RSC
- Absolute / CDN `publicPath` for Vite SSR
- Consumer-swappable Document; production listen-logging parity with webpack SSR

## Decisions

### 1. Mode selection via `renderType`

**Choice:** `renderType?: 'server-side-rendered' | 'static-generated'`.

- `'server-side-rendered'` + `bundler: 'vite'` → Vite SSR via `sku start` / `sku build`
- `'static-generated'` or unset → existing static / SSG
- `'server-side-rendered'` + webpack → **error**
- `start-ssr` / `build-ssr` when `renderType` is set → **error**

**Why:** Render mode belongs in config beside `bundler`. Webpack SSR without the new renderType keeps `start-ssr` / `build-ssr`.

### 2. Data Mode, not Framework Mode

**Choice:** React Router Data Mode (`createStaticHandler` / `createBrowserRouter` + `lazy`). Error pages are RR `ErrorBoundary` + `context.statusCode` — no sku error-page API.

**Why:** sku must own Vite plugins, Node server, and CSP; Framework Mode’s Vite plugin would compete.

### 3. Routes entry + required request entries

**Choice:**

- `routesEntry` (default `src/routes.tsx`) → named `routes: RouteObject[]` (hard error if missing). No `SkuApp`.
- Reuse `serverEntry` / `clientEntry` (defaults `src/server.tsx` / `src/client.tsx`) with Vite SSR named-export contracts (decision 8). Hard error if files or exports missing — no sku noops.
- Middleware (two layers):
  - **Production:** named `middleware` on the **server entry** (required; empty array / passthrough OK). Mounted in both `sku start` and production. Loaded once at process start (not HMR’d in v1).
  - **Dev-only:** optional config `devServerMiddleware` (same key as static/webpack). Mounted only in Vite SSR `sku start`, never imported into the production server graph — separate file / dependency chain for local mocks (e.g. `/api` traffic that production reverse-proxies away from the app).
  - **Dev mount order:** request-context → `devServerMiddleware` → server-entry `middleware` → Vite middlewares → HTML render. Dev middleware first so mocks intercept traffic that would never reach the app in production.
- Document: sku-owned; head/SEO via React 19 metadata. No consumer Document override in v1.

**Rejected:** Porting `renderCallback`; optional entries / soft-skip; parallel `entryServer` / `entryClient`; middleware on the routes entry; second named export / same-file `devMiddleware` (weak isolation — same module graph).

### 4. Commands and deploy shape

**Choice:** Single-port Vite `middlewareMode` + `appType: 'custom'`. `sku build` emits sibling `client/` and `server/` under the build target (neither nested). `httpsDevServer: true` → HTTPS listener + HMR on that server. Production `node dist/server/server.js` stays plain HTTP.

### 5. Full-document streaming

**Choice:** React owns `<html>` / `<head>` / `<body>`. Pipe on `onShellReady`; optional `handle.waitForAll: true` → `onAllReady`. Abort on client disconnect. **React ≥ 19 required** (doctype from `<html>`; document hydrate). Client: `hydrateRoot(document, …)`.

### 6. No `transformIndexHtml` on the SSR path

| Concern                 | Approach                                             |
| ----------------------- | ---------------------------------------------------- |
| React Refresh preamble  | Client entry imports `@vitejs/plugin-react/preamble` |
| Vite client + app entry | `bootstrapModules`                                   |
| CSS + modulepreloads    | Manifest / collector → Document props                |
| Client / router handoff | Hashable `bootstrapScriptContent`                    |

`index.html` is for client-entry discovery only. Static Vite may keep `transformIndexHtml`. SSR-CSS plugin and telemetry HTML inject (which rely on it) are **deferred** for Vite SSR; prod CSS comes from the client manifest.

### 7. CSP: headers from shell

**Choice:** Derive `script-src` from shell HTML before `pipe`. Set enforcing and/or Report-Only headers (`cspReportOnlyReportTo` for `report-to`). Relative `publicPath` only (`'self'`); reject absolute/CDN. Dev loosens for HMR. No meta `http-equiv`.

### 8. Server and client request entries

**Choice:** Named exports only (hard error if missing):

```ts
// serverEntry
export function onRequest(args: { request: Request }): {
  AppWrapper?: ComponentType<{ children: ReactNode }>;
  language?: string;
  clientContext?: JsonValue;
};
export const middleware: RequestHandler | RequestHandler[];

// clientEntry
export function onHydrate(args: { context: JsonValue | undefined }): {
  AppWrapper?: ComponentType<{ children: ReactNode }>;
};
```

**Tree:** `Document` → router provider → optional sku pathless `AppWrapper` layout → consumer `routes`.

- `AppWrapper` = providers only, mounted **inside** the router (may use RR hooks); stable route id on server/client.
- `language` = sole app-owned vocab identity for **server Document preload** (decision 10); run `onRequest` before `query()`; local param only — not ALS, not forwarded to the client.
- `clientContext` = shell-time JSON only; forwarded to `onHydrate` as `context`. Client locale re-derives via RR hooks / providers (or optional `clientContext` if the app wants a one-shot seed).

### 9. Request-scoped nonce (lazy, single value)

**Choice:** At most one CSP nonce per render, minted only when requested (`getCspNonce` / `req.getCspNonce()`). Include `'nonce-…'` in CSP only if requested. Distinct from static/webpack multi-`createUnsafeNonce`. Request-context / AsyncLocalStorage holds **CSP nonce only** — not language (decision 10).

### 10. Vocab / language chunks

**Choice:** When `languages` is configured, keep `@vocab/vite` splitting. Sku registers `getChunkName(language)` on Document assets. App identifies language **only** via server `onRequest` `language` → sole configured language → soft-fail. No `req.skuLanguage`, `:language`, `handle.language`, or `addLanguageChunk`. Language is a **server-local parameter** after `onRequest` (pass into module-id / preload resolution only) — not request-context, not bootstrap, not `onHydrate`. Do **not** expose `getSkuLanguage()` or `__SKU_LANGUAGE__`. Client / loaders that need locale re-derive it the same way `onRequest` did (or via app providers / optional `clientContext`).

### 11. Lazy-route `moduleId`

**Choice:** Auto-derive `handle.moduleId` for idiomatic `lazy: () => import('…')` via Vite SSR transform. Never overwrite explicit; skip non-idiomatic shapes; warn in dev on miss/unknown.

### 12. Shared HTML middleware + loader/action headers

**Choice:** Dev and prod share abort-before-write HTML middleware. On streamed HTML (not short-circuit `Response`), forward `loaderHeaders` / `actionHeaders` (append; preserve `Set-Cookie`), then sku-owned `Content-Type` / CSP.

### 13. Hydration payload safety

**Choice:** Promise-scrub `loaderData` and `actionData`. In production, serialized route errors omit `Error.stack`.

### 14. Per-route chunk fixture

**Choice:** Fixture with ≥2 lazy routes that resolve to distinct client chunks (SSR + hydration).

### 15. `@sku-lib/create` Vite SSR template

**Choice:** Template id `vite-ssr` (`--template` + interactive). Minimal runnable scaffold: `renderType: 'server-side-rendered'`, relative `publicPath`, required named exports at defaults, React 19+. Static `vite` template unchanged.

### 16. Migrating sections in `server-rendering.md`

**Choice:** `## Migrating` with two self-contained subsections (**Migrate from Static App**, **Migrate from Older SSR App**). Requirements/limitations up front; topic headers for config, entries, AppWrapper, middleware, CSP, response headers, hydrate. Not under `docs/migration-guides/`. Primary product docs (outside Migrating) also cover those topics.

## Risks / Trade-offs

| Risk                                    | Mitigation                                                               |
| --------------------------------------- | ------------------------------------------------------------------------ |
| Hydration mismatch on assets/context    | Serialize exact Document asset list; same tree on client                 |
| Shell-only CSP cannot hash late scripts | Lazy single nonce for stream scripts; hash known bootstrap bodies        |
| Absolute/`CDN` `publicPath`             | Config validation rejects; docs say relative-only                        |
| Server stacks in hydrate JSON           | Strip `Error.stack` in production                                        |
| Loader/action headers dropped           | Forward before CSP/`Content-Type`                                        |
| Missing entries / named exports         | Hard error; no sku noops                                                 |
| Server/client `AppWrapper` diverge      | Shared providers; docs: providers only                                   |
| Create template drifts from contracts   | Minimal scaffold + create tests                                          |
| Migration guide over-promises           | Requirements + limitations; sku-surface only                             |
| Mock / stub deps ship in prod server    | Keep mocks in `devServerMiddleware` only; never import from server entry |

## Migration Plan

- Opt-in: `bundler: 'vite'`, `renderType: 'server-side-rendered'`, required routes + request entries
- New apps: `@sku-lib/create --template vite-ssr`
- Existing apps: Migrating subsections in `server-rendering.md`
- Multi-language: return `language` from `onRequest`
- Webpack SSR: leave `renderType` unset; keep `start-ssr` / `build-ssr`
- Rollback: change/remove `renderType`; webpack path unchanged

## Open Questions

- **Custom logger for setup behaviours?** Should sku accept a consumer logger for events like listen-on-port? Until decided, production Vite SSR does not add ad-hoc listen logging.
