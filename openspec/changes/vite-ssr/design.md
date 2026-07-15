## Context

Vite SSR commands are blocked today. Webpack SSR uses Express `renderCallback`, string HTML, and CSP meta tags. This change adds a **Vite-only SSR product** selected by `renderType`, with sku owning the server, Document shell, streaming, assets, and CSP headers, and React Router Data Mode owning routing/data.

## Goals / Non-Goals

**Goals:** Vite SSR via `renderType`; dual-entry `routes` + request-entry contracts; full-document streaming + document hydrate; shell CSP headers; per-route + vocab chunks; create template + Migrating docs; experimental first release.

**Non-Goals:** Webpack mode for this renderType; Framework Mode / RSC; absolute/`CDN` `publicPath`; consumer Document; runtime route-tree matching; production listen-logging parity.

## Decisions

### 1. Mode selection via `renderType`

`renderType?: 'server-side-rendered' | 'static-generated'`. With Vite → `sku start` / `sku build`. Webpack + this renderType → error. `-ssr` when `renderType` is set → error. Webpack SSR without renderType keeps `start-ssr` / `build-ssr`.

### 2. Data Mode, not Framework Mode

`createStaticHandler` / `createBrowserRouter` + `lazy`. Errors via RR `ErrorBoundary` + `context.statusCode`. Sku owns Vite plugins, Node server, and CSP (Framework Mode’s Vite plugin would compete).

### 3. Dual-entry `routes` + request entries

Reuse `serverEntry` / `clientEntry`. Both MUST export `routes: RouteObject[]`. Server: `onRequest`, `middleware`. Client: `onHydrate`. Hard errors if missing. Trees MUST stay hydration-compatible (path/nesting/ids); implementations MAY diverge. Docs/template recommend shared `createRoutes(...)` — not a sku API; no runtime checker.

HTTP middleware (two layers; distinct from RR route `middleware`):

- **Production:** server-entry Express/Connect `middleware` (required; empty OK). Mounted in start and production.
- **Dev-only:** optional config `devServerMiddleware` — start only; never in the production server graph.
- **Dev order:** request-context → `devServerMiddleware` → server-entry `middleware` → Vite → HTML.

Document is sku-owned (React 19 metadata). No consumer Document override in v1.

### 4. Commands and deploy shape

Single-port Vite `middlewareMode` + `appType: 'custom'`. Build emits sibling `client/` and `server/`. `httpsDevServer` → HTTPS + HMR in start; production remains HTTP.

### 5. Full-document streaming

React owns `<html>`/`<head>`/`<body>`. Pipe on `onShellReady`; optional `handle.waitForAll` → `onAllReady`. Abort on disconnect. React ≥ 19. Client: `hydrateRoot(document, …)`.

### 6. No `transformIndexHtml` on the SSR path

Preamble via client entry; Vite client + app via `bootstrapModules`; CSS/modulepreloads via manifest → Document; handoff via hashable `bootstrapScriptContent`. SSR-CSS plugin and telemetry HTML inject deferred for Vite SSR.

### 7. CSP: headers from shell

Derive `script-src` before `pipe`. Enforcing and/or Report-Only (`cspReportOnlyReportTo`). Relative `publicPath` only. No meta `http-equiv`.

### 8. Request-entry shapes

```ts
// serverEntry
export const routes: RouteObject[];
export function onRequest(args: { request: Request }): {
  AppWrapper?: ComponentType<{ children: ReactNode }>;
  language?: string;
  clientContext?: JsonValue;
};
export const middleware: RequestHandler | RequestHandler[];

// clientEntry
export const routes: RouteObject[];
export function onHydrate(args: { context: JsonValue | undefined }): {
  AppWrapper?: ComponentType<{ children: ReactNode }>;
};
```

Tree: `Document` → router → optional pathless `AppWrapper` → entry `routes`. `language` is server-local for Document vocab preload only (not ALS, not `onHydrate`). `clientContext` → hydrate `context`.

### 9. Request-scoped nonce (lazy, single value)

At most one CSP nonce per render, minted only when requested. ALS holds **CSP nonce only**.

### 10. Vocab / language chunks

When `languages` is set: `@vocab/vite` splitting; register `getChunkName(language)` on Document assets. Identity: `onRequest` `language` → sole language → soft-fail. No `getSkuLanguage` / `__SKU_LANGUAGE__`.

### 11. Lazy-route `moduleId`

Auto-derive for idiomatic `lazy: () => import('…')`. Never overwrite explicit; skip non-idiomatic; warn in dev on miss.

### 12. Shared HTML middleware + loader/action headers

Dev/prod share abort-before-write. On streamed HTML, forward `loaderHeaders` / `actionHeaders` (append; preserve `Set-Cookie`), then sku `Content-Type` / CSP.

### 13. Hydration payload safety

Promise-scrub `loaderData` / `actionData`. Production route errors omit `Error.stack`.

### 14. Create template + Migrating docs

Template `vite-ssr` with `createRoutes` scaffold. `## Migrating` in `server-rendering.md` (Static App + Older SSR App); not under `docs/migration-guides/`.

### 15. Experimental first release

Docs warning + changeset: available for testing, not for production. No runtime experimental gate.

## Risks / Trade-offs

| Risk                             | Mitigation                                          |
| -------------------------------- | --------------------------------------------------- |
| Dual `routes` hydration mismatch | Docs + template `createRoutes`; no runtime checker  |
| Shell-only CSP / late scripts    | Lazy single nonce; hash known bootstrap bodies      |
| Absolute/`CDN` `publicPath`      | Config rejects; relative-only docs                  |
| Mock deps ship in prod           | `devServerMiddleware` only; never from server entry |
| Early production use             | Experimental docs + changeset                       |

## Migration Plan

Opt-in via `renderType` + Vite. New apps: `--template vite-ssr`. Existing: Migrating in `server-rendering.md`. Webpack SSR: leave `renderType` unset. Rollback: remove `renderType`.

## Open Questions

- **Custom logger for setup behaviours?** Until decided, production Vite SSR does not add listen logging.
