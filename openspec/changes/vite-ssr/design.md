## Context

Vite SSR commands are blocked today. Webpack SSR uses Express `renderCallback`, string HTML, and CSP meta tags. This change adds a **Vite-only SSR product** selected by `buildType`, with sku owning the server, Document shell, streaming, assets, and CSP headers, and React Router Data Mode owning routing/data.

## Goals / Non-Goals

**Goals:** Vite SSR via `buildType`; dual-entry `routes` + request-entry contracts; full-document streaming + document hydrate; shell CSP headers; per-route + vocab chunks; create template + Migrating docs; experimental first release.

**Non-Goals:** Webpack mode for this buildType; Framework Mode / RSC; absolute/`CDN` `publicPath`; consumer Document; runtime route-tree matching; production listen-logging parity.

## Decisions

### 0. Webpack alignment principle

When choosing Vite SSR implementation details that overlap webpack SSR (compile-time defines, naming, shapes):

1. Do not copy webpack SSR patterns that are a poor fit for Vite SSR.
2. Do not diverge from webpack SSR naming or shapes without a concrete reason.

Prefer webpack-aligned defines (`__SKU_CSP__`, `__SKU_DEFAULT_SERVER_PORT__`) over inventing parallel `import.meta.env.SKU_*` knobs. Prefer a single CSP object over many flat string defines. Prefer dropping unused language allowlisting rather than baking `SKU_LANGUAGES` “because config exists.” No sidecar runtime manifest — webpack-style defines are enough.

### 1. Mode selection via `buildType`

`buildType?: 'ssr' | 'static'`. With Vite → `sku start` / `sku build`. Webpack + this buildType → error. `-ssr` when `buildType` is set → error. Webpack SSR without buildType keeps `start-ssr` / `build-ssr`.

### 2. Data Mode, not Framework Mode

`createStaticHandler` / `createBrowserRouter` + `lazy`. Errors via RR `ErrorBoundary` + `context.statusCode`. Sku owns Vite plugins, Node server, and CSP (Framework Mode’s Vite plugin would compete).

### 3. Dual-entry `routes` + request entries

Reuse `serverEntry` / `clientEntry`. Both MUST export `routes: RouteObject[]`. Server: `onRequest`, `middleware`. Client: `onHydrate`. Hard errors if required named exports are missing (no early file-existence gate). Trees MUST stay hydration-compatible (path/nesting/ids); implementations MAY diverge. Docs/template recommend shared `createRoutes(...)` — not a sku API; no runtime checker.

Vite SSR request-entry wrappers MUST resolve consumer entries via the same aliases as static Vite: `__sku_alias__serverEntry` / `__sku_alias__clientEntry`. Do **not** introduce SSR-only module ids such as `#sku-vite-ssr-server-entry` / `#sku-vite-ssr-client-entry` — those were an earlier parallel scheme with no remaining technical need once `configPlugin` already maps the `__sku_alias__*` ids for all Vite modes. Note: tsdown/rolldown reorders static imports by specifier shape — `#…` sorted after `@vitejs/plugin-react/preamble` while `__…` sorted before it, so the rename alone can surface the fragile “preamble must run before consumer JSX” Refresh ordering issue in the published client entry. Mitigate with a start-only `#entries/vite-ssr-client.dev` that imports the preamble then dynamically loads the production client entry; production builds keep using `#entries/vite-ssr-client` with no preamble.

HTTP middleware (two layers; distinct from RR route `middleware`):

- **Production:** server-entry Express/Connect `middleware` (required; empty OK). Mounted in start and production.
- **Dev-only:** optional config `devServerMiddleware` — start only; never in the production server graph.
- **Dev order:** request-context → `devServerMiddleware` → server-entry `middleware` → Vite → HTML.

Document is sku-owned (React document metadata). No consumer Document override in v1.

### 4. Commands and deploy shape

Single-port Vite `middlewareMode` + `appType: 'custom'`. Build emits sibling `client/` and `server/`. `httpsDevServer` → HTTPS + HMR in start; production remains HTTP.

### 5. Full-document streaming

React owns `<html>`/`<head>`/`<body>`. Pipe on `onShellReady`; optional `handle.waitForAll` → `onAllReady`. Abort on disconnect. Client: `hydrateRoot(document, …)`.

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

When `languages` is set: `@vocab/vite` splitting at build time. At render time, register `getChunkName(language)` on Document assets **only** when `onRequest` returns `language`. Language is optional — if omitted, sku does not register a language chunk. Sku does **not** validate the returned language against config, and does **not** default to a sole configured language. No `getSkuLanguage` / `__SKU_LANGUAGE__` / baked `SKU_LANGUAGES` define.

### 11. Production runtime defines (webpack-aligned)

Production `server.js` has no live `skuContext`. Bake the values it needs with webpack-style defines (no sidecar JSON):

- `__SKU_DEFAULT_SERVER_PORT__` — default listen port; `process.env.PORT` still wins at runtime (same idea as webpack SSR).
- `__SKU_CSP__` — single object aligned with webpack’s `{ enabled, extraHosts }`, extended for Vite Report-Only fields (e.g. `reportOnlyEnabled`, `reportOnlyExtraHosts`, `reportOnlyReportTo`).

Dev continues to pass these from live `skuContext` (no defines required on the start path).

### 12. Lazy-route `moduleId`

Auto-derive for idiomatic `lazy: () => import('…')`. Never overwrite explicit; skip non-idiomatic; warn in dev on miss.

### 13. Intent module preload (fixture pattern, not a sku API)

Document `modulepreload` covers the _matched_ route. Intent warm-up of _next_ lazy chunks (hover/focus/touch) is a consumer/fixture pattern — Data Mode has no `<Link prefetch>` (Framework Mode only). The Vite SSR fixture demonstrates it with `PreloadingLink` + `ClientRoutesContext` provided from the client `AppWrapper` (same `routes` instance as the entry export), so a `createRoutes(...)` factory does not create a circular import through the layout. Calling `route.lazy()` is enough (module cache); no route-tree mutation. Loader-data prefetch is out of scope for this demo. Sku does **not** ship a public PreloadingLink API.

### 14. Shared HTML middleware + loader/action headers

Dev/prod share abort-before-write. On streamed HTML, forward `loaderHeaders` / `actionHeaders` (append; preserve `Set-Cookie`), then sku `Content-Type` / CSP.

### 15. Hydration payload safety

Promise-scrub `loaderData` / `actionData`. Production route errors omit `Error.stack`.

### 16. Create template + Migrating docs

Template `vite-ssr` with `createRoutes` scaffold. `## Migrating` in `server-rendering.md` (Static App + Older SSR App); not under `docs/migration-guides/`.

### 17. Experimental first release

Docs warning + changeset: available for testing, not for production. No runtime experimental gate.

## Risks / Trade-offs

| Risk                             | Mitigation                                                            |
| -------------------------------- | --------------------------------------------------------------------- |
| Dual `routes` hydration mismatch | Docs + template `createRoutes`; no runtime checker                    |
| Shell-only CSP / late scripts    | Lazy single nonce; hash known bootstrap bodies                        |
| Absolute/`CDN` `publicPath`      | Config rejects; relative-only docs; no browser e2e for this edge case |
| Mock deps ship in prod           | `devServerMiddleware` only; never from server entry                   |
| Early production use             | Experimental docs + changeset                                         |

## Migration Plan

Opt-in via `buildType` + Vite. New apps: `--template vite-ssr`. Existing: Migrating in `server-rendering.md`. Webpack SSR: leave `buildType` unset. Rollback: remove `buildType`.

## Open Questions

- **Custom logger for setup behaviours?** Until decided, production Vite SSR does not add listen logging.
