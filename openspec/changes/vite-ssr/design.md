## Context

Vite SSR commands are blocked today.

Webpack SSR uses Express `renderCallback`, string HTML, and CSP meta tags.

This change adds a **Vite-only SSR product** selected by `buildType`, with sku owning the server, Document shell, streaming, assets, and CSP headers, and React Router Data Mode owning routing/data.

## Goals / Non-Goals

**Goals:**

- Vite SSR via `buildType`
- First-class `routesEntry` (named `routes` export) + request-entry contracts
- First-class multi-site route trees (flat `routes` with optional `sites`, sku pre-builds per-site trees, `getSite` selects), same spirit as first-class multi-language
- Full-document streaming + document hydrate
- Shell CSP headers
- Per-route + vocab chunks (sku-owned `@vocab/vite` resolve)
- Create template + Migrating docs
- Experimental first release
- Single-port (`port` only; reject `serverPort`)
- Named `Component` on lazy pages in template/docs
- CJS interop docs
- Accurate config JSDoc
- Ship React Router 8 as an **optional peerDependency** `^8` (Vite SSR only; no hard sku dep)
- Keep shared Express dep on 4 (no 4 → 5 bump)
- No Jest transforms for React Router 8 in this change (Vite SSR requires Vitest)
- Flat request-entry getters: sync `getSite` / `getLanguage` / `getClientContext` receive Express `{ req }` (after consumer middleware); optional `middleware` / `onHydrate`
- Optional dual-entry named `Providers` rendered outside the router (env-scoped dependencies; `site` + `clientContext` props; route tree never wrapped by sku, so `createStaticHandler` is pre-built per site)
- Router-aware, isomorphic providers expressed as the app’s own root layout route in `routesEntry` (plain React Router, no sku API)
- Optional dual-entry `getContext` → RR `RouterContextProvider` for loader/action DI on document SSR and client navigations
- App-owned streaming data transports work: `useInsertHtml` on `sku/ssr` (nonce-able, no-op off the SSR path) with Apollo streaming hydration proven by a fixture — server-run queries not refetched on hydrate, post-hydration queries still fetch
- Docs steer: prefer render-time React data loading via Suspense with dependencies injected through `Providers`; router-aware providers in the app’s root layout route; request-scoped values via `Providers` props (`site` / `clientContext`) or `getContext`; loaders as opt-in; document `getContext` as opt-in; red warning against putting Express `req` (or other non-isomorphic objects) into router context; multi-site via `routesEntry` + flat `routes` + optional `sites` + `getSite`
- Migrating guidance for server-only loaders, Braid reset order, client-only providers, Jest→Vitest, `#` pathAliases
- Config `polyfills` on the Vite SSR browser client (parity with static Vite / webpack SSR)
- Vite SSR `sku start` SSR-CSS (virtual stylesheet via Document assets; no `transformIndexHtml`)
- Vite SSR `sku start` telemetry parity (`start.initial` / `start.rebuild`; no `transformIndexHtml`)

**Non-Goals:**

- Webpack mode for this buildType
- Webpack SSR backfill or updating the Webpack-SSR create template
- Converting the static `vite` create template
- Full infra/deploy product guides (keep sku’s existing docs scope)
- Framework Mode / RSC
- Absolute/`CDN` `publicPath`
- First-class router-basename config
- Vite SSR `serverPort`
- Expanding baked-in CJS interop defaults beyond Apollo
- Consumer Document
- Runtime server↔client route-tree equality checking (unnecessary once `routesEntry` is the single source of truth)
- Dual-entry `routes` re-exports from `serverEntry` / `clientEntry` (replaced by first-class `routesEntry`)
- Differing server vs client route modules as a product feature (with Express `req` on getters / `getContext`, DI no longer needs env-split trees; `routesEntry` is one isomorphic source of truth)
- Sku-owned site resolution from config `hosts` / `sites[].host` (those hosts are local-dev listen/setup only; apps export `getSite`)
- Soft-defaulting config `sites` when empty for Vite SSR (require ≥1 configured site instead)
- Sku-owned per-site path expansion libraries (apps own path shape; sku owns membership filtering via `sites`)
- Per-site JS bundles (trees differ by path registration; page modules stay shared)
- Returning routes from a request-entry getter / bag (client/hydration story is weaker; keep config-as-data via `routesEntry`)
- A combined request-entry resolver / return bag for site + language + clientContext (superseded by separate named getters — see Decision 12)
- Returning a provider component from request-entry exports (superseded: a new component identity per request forced `createStaticHandler` onto the hot path — see Decision 12)
- Sku reading site / language / clientContext from a conventional `req` field (e.g. `req.context.site`); sku-provided push API (`setRequestContext(req, …)`) — shared libraries own their keys and re-export sku-shaped getters
- Tolerating a missing `serverEntry` / `clientEntry` file (entry paths still resolve via normal module resolution; omit unused named exports instead)
- Mounting sku’s provider export inside the route tree as a pathless layout (superseded: putting it inside the router was the only reason sku had to rebuild the tree; router-aware providers belong in the app’s own root layout route — see Decision 12)
- Consumer-authored Async Local Storage as the documented way to reach request state from providers (superseded by `Providers` props)
- Union route tree + site allowlist middleware as the documented multi-site product story (filter-after-match); sku pre-filters membership before RR sees the tree
- Parent→child inheritance of `sites` (site-specific routes MUST set `sites` explicitly; friction is intentional)
- Overloading config `routes` (static prerender path lists) as the Vite SSR `RouteObject` entry — use `routesEntry` instead
- Production listen-logging parity
- Supporting the config `public` assets folder for Vite SSR (until a definitive need)
- Automatic `*.server.ts` client strip
- Auto-injecting Braid reset into sku’s Vite SSR server entry
- A new Jest→Vitest codemod beyond existing tooling/docs
- Making Express `req` the loader `request` argument (stays Fetch `Request`)
- Treating Framework Mode server-only `getLoadContext(req, res)` as sufficient for sku Data Mode
- Requiring `getContext` (optional; omit → today’s empty/default behaviour)
- Requiring `Providers` (optional named export; omit → sku renders the router directly)
- Requiring `middleware` (optional; omit → no consumer middleware layer)
- Requiring `onHydrate` (optional; omit → no hydrate side effects)
- Requiring `getSite` when config has a single site (sku uses the sole config name; if exported, still call + validate)
- Passing Fetch `Request` into request-entry getters (Express `req` only; Fetch stays on `query` / server `getContext`)
- Passing `res` into getters / `getContext` in v1 (loaders/sku already own response headers)
- Async request-entry getters (sync-only; keep them pure/simple — libs may memoise on `req`)
- Treating raw Express `req` (or other non-isomorphic platform objects) in `RouterContextProvider` as a supported pattern
- Shipping Jest support for React Router 8 (transforms / ESM interop)
- Forcing webpack fixtures or non–Vite-SSR apps onto React Router 8
- Treating RR loaders as the default teaching path for page content
- Upgrading sku’s shared Express dependency from 4 → 5 (deferred; would break webpack SSR)
- Supporting `@sku-lib/vite/loadable` (Collector / `LoadableProvider` / `preloadPlugin` module-id injection) as a Vite SSR document-preload source
- Supporting `dangerouslySetViteConfig` for Vite SSR (static Vite unchanged)
- A sku-owned Apollo dependency, provider, config option, or version pin (sku ships the transport-agnostic `useInsertHtml` seam; apps own the client and transport)
- `@apollo/client-integration-react-router`’s loader transport (`apolloLoader` / `preloadQuery` transported query refs in loader data) — alpha, RR7-peered, and its promise-carrying refs cannot survive sku’s JSON, promise-scrubbed bootstrap (see Decision 21a)
- Streaming (turbo-stream) loader-data serialization to carry transported query refs (would pull sku toward Framework Mode)
- Two-pass `getDataFromTree` SSR (incompatible with streaming; the pattern this mode replaces)
- Sku auto-attaching the CSP nonce to app-injected scripts (transports expose their own script props)

## Decisions

### 1. Webpack alignment principle

When choosing Vite SSR implementation details that overlap webpack SSR (compile-time defines, naming, shapes):

1. Do not copy webpack SSR patterns that are a poor fit for Vite SSR.
2. Do not diverge from webpack SSR naming or shapes without a concrete reason.

Prefer webpack-aligned defines (`__SKU_CSP__`, `__SKU_DEFAULT_SERVER_PORT__`) over inventing parallel `import.meta.env.SKU_*` knobs.

Prefer a single CSP object over many flat string defines.

Prefer dropping unused language allowlisting rather than baking `SKU_LANGUAGES` “because config exists.”

No sidecar runtime manifest — webpack-style defines are enough.

### 2. Mode selection via `buildType`

`buildType?: 'ssr' | 'static'`.

With Vite → `sku start` / `sku build`.

Webpack + this buildType → error.

`-ssr` when `buildType` is set → error.

Webpack SSR without buildType keeps `start-ssr` / `build-ssr`.

### 3. Data Mode, not Framework Mode

`createStaticHandler` / `createBrowserRouter` + `lazy`.

Errors via RR `ErrorBoundary` + `context.statusCode`.

Sku owns Vite plugins, Node server, and CSP (Framework Mode’s Vite plugin would compete).

### 4. `routesEntry` + request entries

Reuse `serverEntry` / `clientEntry` for request lifecycle.

Add first-class config `routesEntry` (default `src/routes.tsx`) for the route tree.

Sku resolves it via `__sku_alias__routesEntry` into **both** the server and client Vite graphs (same alias pattern as `__sku_alias__serverEntry` / `__sku_alias__clientEntry`).

`routesEntry` MUST export named `routes: SkuSsrRouteObject[]`.

`SkuSsrRouteObject` is a sku type helper only: `RouteObject & { sites?: string[] }`.
Sku MUST NOT re-export a wrapped React Router `RouteObject` as the product API — consumers still import route primitives from `react-router` and may use `SkuSsrRouteObject` from sku for the optional `sites` field.

Missing or non-array `routes` on `routesEntry` MUST hard-error.

Sku loads `routes` from `routesEntry` only — it does not read `routes` / `routesBySite` from `serverEntry` / `clientEntry`.

Config `routes` (static prerender path lists) remains unrelated — do not overload that key for Vite SSR `RouteObject` trees.

Server: optional sync `getSite` / `getLanguage` / `getClientContext`; optional `middleware`, `Providers`, `getContext`.

Client: optional `onHydrate`; optional `Providers`, `getContext`.

`getSite` is required **only** when config `sites` has more than one entry — missing export then hard-errors at init (same class as missing `routes` on `routesEntry`).

Optional named exports omitted ⇒ noops / defaults (no consumer middleware; no hydrate side effects; sole config site when `getSite` omitted on a single-site app).

Hard errors if a required named export is missing (no early file-existence gate — missing entry files fail via normal module resolution).

Optional `Providers`, `getContext`, and the request getters are **separate named exports** on each request entry — not folded into a return bag.
`Providers` renders **outside** the router, so it MUST NOT use React Router hooks; server and client MAY export different providers (e.g. client-only `window` SDKs on the client entry only).
Client `getContext` must be a stable function called on every client navigation/fetcher by `createBrowserRouter`.

One `routesEntry` module is the isomorphic source of truth for both graphs — no dual re-export, no “implementations MAY diverge” escape hatch as a product feature.
With Express `req` on the getters / optional `getContext`, and dual-entry `Providers`, shell and loader DI no longer need env-split route modules.
Server-only loader modules remain a docs/convention concern (keep them off the client-imported graph; no automatic `*.server.ts` strip).

Vite SSR wrappers resolve consumer modules via `__sku_alias__serverEntry` / `__sku_alias__clientEntry` / `__sku_alias__routesEntry`.

Note: tsdown/rolldown reorders static imports by specifier shape — `#…` sorted after `@vitejs/plugin-react/preamble` while `__…` sorted before it, so using `#` entry ids can surface the fragile “preamble must run before consumer JSX” Refresh ordering issue in the published client entry.

Mitigate with a start-only `#entries/vite-ssr-client.dev` that imports the preamble then dynamically loads the production client entry; production builds keep using `#entries/vite-ssr-client` with no preamble.

**Config `polyfills` (browser client):** Sku’s Vite SSR client entry (`vite-ssr-client.tsx`, including the start-only `.dev` wrapper’s production client load) MUST import `virtual:sku/polyfills` before hydrate / consumer client-entry code — same virtual module as static `vite-client.tsx`.

`polyfillsPlugin` remains on the shared Vite plugin graph; it is not static-only. Without that import the plugin is inert for SSR.

Polyfills apply to the **browser** client graph only. Do not load them into the Node server entry.

HTTP middleware (two layers; distinct from RR route `middleware`):

- **Production:** optional server-entry Express/Connect `middleware`. Omit ⇒ no consumer middleware layer (not an error). Mounted in start and production when present.
- **Dev-only:** optional config `devServerMiddleware` — start only; never in the production server graph.
- **Dev order:** request-context → `devServerMiddleware` → server-entry `middleware` (if any) → Vite → HTML.

Document is sku-owned (React document metadata). No consumer Document override in v1.

### 4a. Flat `routes` + optional `sites` → pre-built site trees

Multi-site apps need different React Router path sets per site (e.g. site-only pages).
A single unfiltered `RouteObject[]` either over-matches unsupported paths or registers foreign paths on every host.

Config `hosts` / `sites[].host` are **local-dev listen and setup-hosts only**.
Sku MUST NOT derive production (or request) site from them for route-tree selection.

**Apps own:** site resolution (from Express `req`, headers, app config, etc.) via sync `getSite({ req })`, and per-site **path shape** when paths differ by site (factories remain fine for `/jobs` vs `/emploi`).
Membership is declared on routes.

**Sku owns:** typing `SkuSsrRouteObject.sites`, loading `routes` from `routesEntry`, pre-building per-site trees from config site names, stripping `sites` before RR APIs, creating `createStaticHandler` **once per site at init** (sku never wraps the tree — provider mounting is outside the router), selecting that handler for the resolved `site`, serializing `site` into the hydrate bootstrap, and using that same `site` on the client for `createBrowserRouter`.

**Route membership:**

- `routesEntry` exports flat `routes: SkuSsrRouteObject[]`.
- Optional `sites?: string[]` on a route. Omit / undefined ⇒ route is included for **every** config site.
- Present `sites` ⇒ route is included **only** for those site names (exact string match against config site names).
- **No parent→child inheritance** of `sites`. Site-specific deviation MUST set `sites` explicitly on each route that differs — friction is intentional; site splits should stay uncommon.
- Tree walk is still recursive: if a parent is excluded for a site, that parent’s subtree is absent from that site’s tree (structure, not field inheritance).

**Config sites:** Vite SSR requires a non-empty config `sites` array (≥1 site name). Empty `sites` → hard error at config/init.
Optimise for multi-site; single-site apps still declare one real name.

**Pre-build:** At init (not per request), for each config site name, sku deep-filters `routes` into a site tree and strips `sites` from the objects passed to React Router.
Client needs the same site-name list (bake from config for production client, same as other `__SKU_*` defines) so both sides pre-build identically from the same `routesEntry` module.

**Resolve site:**

- One configured site ⇒ sku uses that name when `getSite` is omitted; if `getSite` is exported, sku still calls it and validates the return.
- Multiple configured sites ⇒ missing `getSite` export is a **hard error at init** (names the export; same treatment as missing `routes` on `routesEntry`).
- Non-string `site` from `getSite`, or a `site` not among config site names / no pre-built entry → **fail closed** per request (hard error).

**Select tree / handler:** the pre-built tree (and server `createStaticHandler`) for that `site`.
Client uses the same `site` for `createBrowserRouter`.

Do **not** call `createStaticHandler` on the per-request hot path — only `query()` / `createStaticRouter` are per request.

`site` is first-class in the hydrate bootstrap (not stuffed into `clientContext`, not passed into `onHydrate` args).
`onHydrate` stays `{ clientContext }` only (optional export).

Config `sites[].routes` (static prerender path lists) remains unrelated to Vite SSR `RouteObject` trees.

**Why not alternatives as the product answer:**

| Approach                                  | Why not                                                                                                         |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Sku host → site via config `sites[].host` | Config hosts are local-dev only; production hostnames are app/platform-owned                                    |
| Union tree + site allowlist middleware    | Cross-site paths still match then 404; easy to get wrong on client nav; every migrant reinvents it              |
| `routesBySite` map                        | Trialled and rejected; apps hand-build N trees; membership belongs on the route; sku can pre-filter a flat list |
| Dual-entry `routes` re-exports            | Redundant once `getContext` / getters cover DI; hydration mismatch risk; `routesEntry` is one truth             |
| Getter / bag returns routes               | Weaker config-as-data; larger hydrate story; `routesEntry` stays clearer                                        |
| Optional path params for “language”       | Matches unsupported prefixes; not site-correct                                                                  |
| One deploy/process per site               | Does not match multi-host deploys that share a process                                                          |
| Inherit `sites` from parents              | Hides site splits; explicit annotation keeps deviation visible                                                  |
| Overload config `routes`                  | Already means static prerender path lists; keep `routesEntry` for the RR module                                 |
| Conventional `req` field / sku push API   | Unversioned `string \| undefined`; collides across consumers; fails only on a request — see Decision 12         |
| Combined site+language+context resolver   | Reintroduces the return-bag shape Decision 12 pulled apart                                                      |

Document multi-site Vite SSR via `routesEntry` + flat `routes` + optional `sites` + `getSite`, not those workarounds.

### 5. Commands and deploy shape

Single-port Vite `middlewareMode` + `appType: 'custom'` for `sku start` (listen on `port`).

Build emits sibling `client/` and `server/`; production entry is `dist/server/server.js`.

`httpsDevServer` → HTTPS + HMR in start; production remains HTTP.

Webpack SSR’s dual-port mental model (`port` for assets + `serverPort` for the Node app) does **not** apply.

Vite SSR uses a single config `port` for `sku start` and as the baked production default listen port (`__SKU_DEFAULT_SERVER_PORT__`).

`process.env.PORT` still overrides at runtime.

Providing `serverPort` with Vite SSR MUST fail config validation (webpack-only).

Migrating docs must call this out (drop `serverPort`; map old `serverPort` → `port` or rely on `PORT`).

### 6. `publicPath` is the static asset prefix only (not React Router basename)

`publicPath` is sku’s asset prefix — the public URL path for static assets (webpack parity via `__SKU_PUBLIC_PATH__`).

**Production / `sku build`:** Vite `config.base` is set to `publicPath` so emitted client URLs match. The production server mounts `express.static` at that prefix. HTML injects assets under `publicPath`.

**`sku start`:** Ignore config `publicPath` and serve the Vite module graph from `/` (webpack SSR start parity). Bootstrap scripts are `/@vite/client` and `/@fs/…` — not under `publicPath`. Documents stay on app routes outside any asset prefix either way.

Sku MUST NOT treat Vite’s built-in `import.meta.env.BASE_URL` as a product concept or pass it (or `publicPath`) as React Router `basename`.

Basename stays unset (effectively `/`).

Path-prefixed SPA basenames are a discouraged pattern and MUST NOT become a first-class sku config.

Relative `publicPath` values like `/static/my-app` MUST work in production with app HTML served on routes outside that prefix.

Cover with a fixture or equivalent test (production asset prefix; start bootstrap at `/`).

Do **not** set Vite `config.base` to `publicPath` for `sku start` — that conflates Vite’s app-root with sku’s asset prefix and breaks static SPA start when shared.

### 7. No config `public` assets folder for Vite SSR

Config `public` designates a folder of files copied/served as-is (unhashed).

That pattern often bypasses content hashing / cache-safe URLs and is used to avoid production-ready asset serving.

Until there is a definitive need, Vite SSR MUST NOT support it.

Config always has a `public` path (default `'public'`), so the signal is directory existence — not whether the option is set.

On `sku start` / `sku build` for Vite SSR: if `paths.public` exists on disk, hard-error with guidance to import assets from scripts instead (Vite hashed pipeline).

Implementation MUST also disable the copy/serve path for this mode:

- Do **not** set Vite `publicDir` to `paths.public` (use `false` / unset for SSR).
- Do **not** call `copyPublicFiles` after the Vite SSR build.

Static Vite and webpack keep today’s `public` behaviour.

Docs MUST discourage the pattern for Vite SSR and note importing images/assets in modules as the alternative.

Migrating MUST call out moving off `public` when adopting Vite SSR.

### 8. No `dangerouslySetViteConfig` for Vite SSR

`dangerouslySetViteConfig` is a raw Vite escape hatch.

Sku opens escape hatches only for known best-practice needs.

As a new API without legacy to support, Vite SSR does not support this option.

When it is set with Vite SSR, config validation MUST hard-error and point consumers to sku-support channels with their use-case.

Static Vite keeps today’s behaviour.

Do not apply the decorator plugin on the Vite SSR plugin graph (redundant once validation rejects, but keeps the SSR path explicit).

Docs (`configuration.md` + Vite SSR product / Migrating) MUST state that the option is unsupported for Vite SSR and that exceptional Vite customisation needs should go through support first.

### 9. Full-document streaming

React owns `<html>`/`<head>`/`<body>`.

Pipe on `onShellReady`; optional `handle.waitForAll` → `onAllReady`.

Abort on disconnect.

Client: `hydrateRoot(document, …)`.

### 10. No `transformIndexHtml` on the SSR path

Preamble via client entry; Vite client + app via `bootstrapModules`; CSS/modulepreloads via manifest → Document; handoff via hashable `bootstrapScriptContent`.

Static Vite injects serve-only HTML (SSR-CSS link, telemetry clients) through `transformIndexHtml`.

Vite SSR MUST NOT call `transformIndexHtml` on document responses.

Serve-only concerns that still apply to Vite SSR `sku start` (SSR-CSS, telemetry) MUST inject via Document assets and/or the browser client entry / `bootstrapModules` instead — see Decisions 10a and 10b.

Production CSS remains client-manifest → Document (unchanged).

### 10a. SSR-CSS on Vite SSR `sku start`

`vitePluginSsrCss` collects CSS reachable from configured entries into `virtual:ssr-css.css` and (on static Vite) injects a `<link>` plus HMR cleanup via `transformIndexHtml`.

For Vite SSR `sku start`:

- Mount `vitePluginSsrCss` on the SSR plugin graph with entries that reach CSS in the SSR module graph (consumer `serverEntry` and/or sku’s Vite SSR server entry — not static’s `renderEntry`).
- Put the virtual stylesheet URL into Document `assets.css` so the existing Document `<link rel="stylesheet">` path emits it (no HTML transform).
- Move the HMR cleanup that removes stale `[data-ssr-css]` links onto a client-entry / bootstrap-module path (same “no transformIndexHtml” rule).
- Mark the Document link so cleanup can still target it (`data-ssr-css` or equivalent).

Production Vite SSR MUST NOT rely on this plugin — CSS comes from the client manifest.

Goal: avoid an unstyled flash on `sku start` until the client graph loads styles.

### 10b. Telemetry on Vite SSR `sku start`

`telemetryPlugin` is serve-only (`apply: 'serve'`). On static Vite it injects page-load + HMR client scripts via `transformIndexHtml` and wires Vite WS handlers / `handleHotUpdate`.

For Vite SSR `sku start`:

- Mount `telemetryPlugin` on the SSR plugin graph with tags such as `type: 'ssr'` (parity with static’s `type: 'static'`).
- Deliver the page-load and HMR client scripts via the Vite SSR browser client entry and/or a serve-only module in `bootstrapModules` — not via `transformIndexHtml`, and not as new Document inline scripts (CSP already tracks `bootstrapScriptContent`).
- Mark `initialPageLoad` when the SSR dev server is ready (static does this in `middlewarePlugin.configureServer`). `skuStart.mark()` in `viteStartHandler` already covers both modes.
- Keep WS handlers + `handleHotUpdate` behaviour once the plugin is on the middleware-mode server.

Emit the same metrics as static start: `start.initial` and `start.rebuild`.

### 11. CSP: headers from shell

Derive `script-src` before `pipe`.

Enforcing and/or Report-Only (`cspReportOnlyReportTo`).

Relative `publicPath` only (asset base; still covered by `'self'`).

No meta `http-equiv`.

**Coexistence with static Vite CSP (merged from master):** Static Vite now has `cspDelivery: 'tag' | 'header'` (meta vs `metadata.csp` JSON) and Report-Only via `createCSPHandler` → `metadata.cspReportOnly` / start-time headers. That path is separate from Vite SSR. Vite SSR keeps its own `buildCspHeaders` (real response headers, lazy single nonce, `cspReportOnlyReportTo`). Do not route Vite SSR through `cspDelivery` or the static HTML CSP handler.

### 12. Request-entry and routesEntry shapes

```ts
// sku public type (lighter option — not a wrapped RR re-export)
type SkuSsrRouteObject = RouteObject & { sites?: string[] };

// routesEntry (config `routesEntry`, default `src/routes.tsx`)
export const routes: SkuSsrRouteObject[];

// serverEntry — all exports optional except getSite when config has >1 site
export function getSite?(args: {
  req: Express.Request; // after consumer middleware
}): string;
export function getLanguage?(args: { req: Express.Request }): string | undefined;
export function getClientContext?(args: {
  req: Express.Request;
}): JsonValue | undefined;
export const middleware?: RequestHandler | RequestHandler[];
/** Optional env-scoped providers — rendered OUTSIDE the router (no RR hooks) */
export const Providers?: ComponentType<SkuSsrProvidersProps<Context>>;
export function getContext?(args: {
  request: Request; // Fetch — same shape as query()/loaders
  req: Express.Request;
}): RouterContextProvider | Promise<RouterContextProvider>;

// clientEntry — all exports optional
export function onHydrate?(args: { clientContext: JsonValue | undefined }): void;
/** Optional env-scoped providers — may differ from server (e.g. window-only SDKs) */
export const Providers?: ComponentType<SkuSsrProvidersProps<Context>>;
export function getContext?(
  // optional sku wrapper if injecting clientContext; RR native getContext is zero-arg
  args?: { clientContext?: JsonValue },
): RouterContextProvider;

// sku public type
type SkuSsrProvidersProps<Context extends JsonValue = JsonValue> = {
  children: ReactNode;
  site: string;
  clientContext: Context | undefined;
};
```

**Why named getters instead of `onRequest`:** Consistent with pulling `Providers` / `getContext` out of a return bag into named exports — site / language / clientContext get the same shape rather than a second, different mechanism.

Pull over push: a getter is typed, testable, and (for multi-site `getSite`) fails at boot. Reading a middleware-written field on `req` is `string | undefined`, unversioned, collides with non-SEEK consumers, and can only fail on a request with an error naming a key nobody in the repo typed.

One re-export line gives shared-library users the same ergonomics as a magic key, with the coupling owned by the library that ships the middleware:

```ts
export { getSite, getLanguage } from '@seek/some-lib/sku';
```

Sku holds **no** opinion about where values live on `req` — no conventional key, no default getter reading one.

Accepted cost: site and language often derive from one parse, so two getters can parse twice. Libraries can memoise on `req`. Rejected a single combined resolver because it reintroduces the return-bag shape.

Getters are **sync-only** and SHOULD stay pure/simple — docs recommend that. (Optional `getContext` may still be async because it seeds loader DI next to `query`.)

**Call order (all before `query()`):** `getSite` (or sole config site) → `getLanguage` → `getClientContext`, then optional server `getContext`, then `query()`.
`getClientContext` runs before render so its value reaches `Providers` props and the hydrate bootstrap.
Keep the existing docs warning that `clientContext` is serialised after shell-ready into the bootstrap script.

Tree: `Document` → optional `Providers` → router (pre-built tree for `site`) → that site’s routes, whose root layout route is app-owned.

`site` from `getSite` (or the sole config site) selects the pre-built handler/tree and is serialized into the hydrate bootstrap for the client router.
It is **not** an `onHydrate` argument.

`language` from `getLanguage` is server-local for Document vocab preload only (not Async Local Storage, not `onHydrate`).

`clientContext` from `getClientContext` → hydrate `clientContext` (same name on both sides).

Omit `middleware` ⇒ no consumer middleware layer.
Omit `onHydrate` ⇒ no hydrate side effects.

### 12a. Providers render outside the router; router-aware wrapping is an app route

Two wrapping concerns were previously conflated into one sku-owned `AppWrapper` mounted as a pathless layout **inside** the router:

1. **Router-aware, isomorphic wrapping** — needs `useLocation` / loader data (e.g. `VocabProvider` keyed on pathname, page chrome).
2. **Environment-scoped dependency injection** — server and client need _different_ modules (client-only `window` SDKs, server-only clients). `routesEntry` is one shared module, so it cannot express this.

React Router splits these already. Framework Mode puts router-aware wrapping in `root.tsx` (`Layout` / `App`) and env-specific providers in `entry.server.tsx` / `entry.client.tsx`, where the app wraps `<ServerRouter />` / `<HydratedRouter />` **outside** the router. Data Mode is the same shape without the ceremony — the app renders `<RouterProvider />` itself and wraps outside it.

Sku owns the render call, so an app cannot wrap outside the router. That — and only that — is what the entry export exists for.

**Split accordingly:**

- **Concern 1 → the app’s own root layout route in `routesEntry`.** Plain React Router, no sku API. Route hooks, loader data, and Suspense all work normally, and it is isomorphic by construction.
  Prefer a **pathless** layout route over `path: '/'`: matching is identical (relative children join against `/` either way), it reads as a layout rather than a URL, and it keeps wrapping any root-level sibling added later.
- **Concern 2 → optional named `Providers` on each entry, rendered outside the router.** No React Router hooks available (enforced by position, not by docs). Sku passes `site` and the request `clientContext` as props, so request-scoped values arrive directly.

**Consequences:**

- Sku never wraps the route tree. There is no pathless wrapper route, no sku-owned route id, and no hydration-shape alignment concern.
- `createStaticHandler` per site at init falls out for free — nothing on the request path can touch the tree, so the earlier hot-path problem does not need mitigating, it stops existing.
- Request-scoped values need no smuggling channel: no consumer-authored Async Local Storage, no module-level `let` set by `onHydrate`, no internal React context to inject props into a tree-mounted wrapper.
- Component identity stops being load-bearing. Outside the tree, a fresh identity per request costs nothing (the server renders fresh per request; the client renders once at hydrate). Named exports remain for typing and clarity.

**Trade-offs:**

- A provider that is both client-only _and_ router-aware splits into two pieces: the dependency in the client `Providers`, and a small router-aware consumer component in the root layout. This matches how the same problem is solved in Framework Mode.
- Server and client `Providers` may differ, so they MUST render identical DOM — prefer context-only providers that emit no markup. Sku MUST warn in development when an entry’s `Providers` renders hydration-relevant markup.

Request-scoped **values** (API clients, logger, user id) reach the app via:

- `Providers` props — `site` and the `clientContext` seed, identical on both sides by construction,
- re-derivation from the URL inside the app’s root layout route (e.g. locale from `useLocation`) for values that must track client navigation,
- optional dual-entry `getContext` for loader/action DI.

Do **not** teach consumer-authored Async Local Storage, module-level mutable state, or “return a wrapper from a request-entry export” as the DI pattern.

`clientContext` is the page-load seed and does not change across client navigations; values that must track navigation belong in concern 1.

**Getters receive `{ req }` only:** Thread Express `req` from `createHtmlRenderMiddleware` / the render path into `getSite` / `getLanguage` / `getClientContext`.
Do **not** pass Fetch `Request` into those getters — site / language / `clientContext` need the middleware bag; URL/path/headers are available on Express `req`.
`query()` continues to use Fetch `Request` only.
Document **`req` only, not `res`**.

**Typing middleware-attached fields on `req`:** The getters / server `getContext` use Express’s `Request`. Middleware-appended values (`req.user`, `req.log`, …) are not on the stock type. Product docs MUST show consumers how to augment Express (same approach sku uses for `getCspNonce`):

```ts
// e.g. src/types/express.d.ts (ensure included by tsconfig)
declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: string };
    log?: { info: (msg: string) => void };
  }
}
```

Then getters / server `getContext` can read `req.user` / `req.log` with type-checking. Document that augmentation applies across `middleware`, the getters, and server `getContext` (one shared Express `Request` type).

**Optional dual-entry `getContext`:** Same typed keys (`createContext` + `RouterContextProvider`); different construction per environment. Server `getContext` keeps both Fetch `request` and Express `req` because it seeds loader/action DI next to `query(request)`.

- Server: sku calls before `query()` and passes the result as `requestContext`.
- Client: sku passes to `createBrowserRouter({ getContext })`. RR’s native `getContext` is zero-arg; if sku injects `clientContext`, wrap RR’s API.
- Omit either export → empty/default context behaviour.

```ts
import { createContext, RouterContextProvider } from 'react-router';
export const userContext = createContext<User | null>(null);
// server getContext: ctx.set(userContext, req.user ?? null)
// client getContext: ctx.set(userContext, readSessionUser() /* different source */)
// loader: context.get(userContext)
```

`Providers` (React dependencies) and `getContext` (loader/action DI) compose; apps may only need one.

They cannot be collapsed into one channel: React Router 8 exposes no public hook for reading `RouterContextProvider` from components (only `useLoaderData` / `useOutletContext` / `unstable_useRouterState` and `UNSAFE_*` internals), so `getContext` cannot serve component-level dependencies. Docs MUST state which channel to use for which consumer.

### 13. Request-scoped nonce (lazy, single value)

At most one CSP nonce per render, minted only when requested.

Async Local Storage holds **CSP nonce only**.

### 14. Vocab / language chunks

When `languages` is set: `@vocab/vite` splitting at build time.

**Resolve ownership:** `@vocab/vite` is a sku dependency. Consumers MUST NOT need a direct `@vocab/vite` dep for resolve to succeed.

When the vocab plugin / `languages` is active, sku’s shared Vite config (`packages/sku/src/services/vite/plugins/config.ts`) MUST:

1. Resolve `@vocab/vite` from **sku’s** install tree (`createRequire(import.meta.url)`), not the app’s `node_modules`.
2. Pin bare imports onto that copy via `resolve.alias`:
   - `@vocab/vite/runtime` → absolute file from `require.resolve('@vocab/vite/runtime')` (prefer the export file, not only the package name — more reliable under Rolldown/Vite).
   - Do **not** alias the `@vocab/vite` package root — that breaks subpath imports such as `@vocab/vite/chunks` (sku’s own SSR render imports it).
3. Apply aliases in the **shared** Vite config (covers both client and SSR builds today).

That forces injected imports (including ones `@vocab/vite` injects into `.vocab` files) onto sku’s copy — one instance, aligned with the plugin sku loaded.

**Shared packages:** The alias is project-wide. It also covers bare `@vocab/vite/runtime` from shared React packages (e.g. Header/Footer with `.vocab`) when those modules are in the Vite graph — the usual sku path via `compilePackages` (SSR `noExternal`). Vocab’s compile ignore already skips only `node_modules/sku/**` and `node_modules/vocab/**`, so dependency `.vocab` folders remain discoverable; sku separately compiles configured `compilePackages` roots because Vocab’s own compile ignores `node_modules`.

Out of scope / does not help: packages left as true SSR externals where Node resolves `@vocab/vite/runtime` at runtime outside Vite (uncommon for sku shared UI).

If a consumer also installs `@vocab/vite`, the alias still prefers sku’s copy.

Do **not** enable these aliases when vocab / `languages` is inactive (avoid resolving unused).

At render time, register `getChunkName(language)` on Document assets **only** when `getLanguage` returns `language`.

Language is optional — if `getLanguage` is omitted or returns `undefined`, sku does not register a language chunk.

Sku does **not** validate the returned language against config, and does **not** default to a sole configured language.

No `getSkuLanguage` / `__SKU_LANGUAGE__` / baked `SKU_LANGUAGES` define.

Migrating / Vocab docs MUST **not** tell consumers to install `@vocab/vite` solely so `@vocab/vite/runtime` resolves.

### 15. Production runtime defines (webpack-aligned)

Production `server.js` has no live `skuContext`.

Bake the values it needs with webpack-style defines (no sidecar JSON):

- `__SKU_DEFAULT_SERVER_PORT__` — default listen port from config `port` (same value as `sku start`). Keep the webpack-aligned define **name**; do not introduce a second Vite SSR port knob. `process.env.PORT` still wins at runtime. Providing `serverPort` with Vite SSR MUST error.
- `__SKU_PUBLIC_PATH__` — static asset prefix from config `publicPath` (webpack SSR parity). Do not use Vite’s `import.meta.env.BASE_URL` in sku runtime code.
- `__SKU_CSP__` — single object aligned with webpack’s `{ enabled, extraHosts }`, extended for Vite Report-Only fields (e.g. `reportOnlyEnabled`, `reportOnlyExtraHosts`, `reportOnlyReportTo`).

Dev continues to pass these from live `skuContext` (no defines required on the start path).

### 16. Lazy-route `moduleId` (Vite SSR preload source)

Auto-derive for idiomatic `lazy: () => import('…')`.

Never overwrite explicit; skip non-idiomatic; warn in dev on miss.

Vite SSR Document CSS / `modulepreload` links come **only** from matched-route `handle.moduleId` values (plus optional vocab language chunks) resolved against the Vite client manifest.

`@sku-lib/vite/loadable` remains the static / prerender code-splitting and preload API (`createPreRenderedHtml` + Collector / `LoadableProvider` + `preloadPlugin` third-arg `moduleId` injection).

Vite SSR does **not** wire that collector into the streamed Document.

Rationale: React Router Data Mode already owns route-level splitting via `lazy`. A second loadable-based preload channel would duplicate the API, leave Document assets out of sync with “I used loadable,” and complicate Migrating from webpack SSR (which already requires a route-model rewrite).

Nested component splits inside a route are not first-class Document preloads in v1; consumers can still use client-side lazy loading without sku injecting those chunks into the initial HTML.

### 17. Intent module preload (`usePreloadRoute`)

Document `modulepreload` covers the _matched_ route.

Warming the _next_ route's lazy chunks on hover / focus / touch is a separate concern — Data Mode has no `<Link prefetch>` (Framework Mode only).

Sku owns it, because sku already owns the tree the warm-up must match against.
The client entry selects the site tree with `selectForSite` before creating the router, and registers it on a shared module.
Module identity holds by the same mechanism that makes `getCspNonce` work: `tsdown` builds this package with `unbundle: true`, so `dist/index.mjs` and `dist/entries/vite-ssr-client.mjs` import one instance of that module.

The hook lives on its own subpath so the main `sku` entry never pulls in the optional `react-router` peer for webpack / static consumers:

```tsx
import { usePreloadRoute } from 'sku/ssr';

const preload = usePreloadRoute(to); // resolves `to` via `useHref` at render
<Link
  to={to}
  onMouseEnter={preload}
  onFocus={preload}
  onTouchStart={preload}
/>;
```

`usePreloadRoute(to)` returns a `() => void`.
It is fire-and-forget: `lazy()` returns a promise, and a failed warm-up must not surface as an unhandled rejection — the real navigation reports the error.

Matching runs against the site-filtered tree, so a path belonging to another site never warms.

Sku handles both `lazy` shapes (a function, or an object of per-property lazy functions).

Calling `lazy()` is enough (module cache serves navigation's later call); no route-tree mutation.

Outside Vite SSR, and during server render, no tree is registered and the returned function is a silent no-op.
Invoking it on the client with no registered tree warns in development.

Rejected: exposing the tree itself (a routes context or `useRoutes()`).
Every consumer would re-implement the same `matchRoutes` + `lazy()` loop, and an unfiltered tree is easy to pass by mistake.
Owning the loop also leaves room to skip already-warmed matches, warm route CSS from the client manifest, and respect `navigator.connection.saveData`.

Loader-data prefetch stays out of scope.

### 18. Shared HTML middleware + loader/action headers

Dev/prod share abort-before-write.

On streamed HTML, forward `loaderHeaders` / `actionHeaders` (append; preserve `Set-Cookie`), then sku `Content-Type` / CSP.

### 19. Hydration payload safety

Promise-scrub `loaderData` / `actionData`.

Production route errors omit `Error.stack`.

### 20. Create template + Migrating docs

Template `vite-ssr` with non-empty config `sites` (typically one site), `routesEntry` + flat `routes` scaffold (optional route-level `sites` only when membership differs), realistic `middleware` + `Providers` + `onHydrate`.
Single-site template omits `getSite` (sku uses the sole config name); multi-site examples export `getSite`.
Request entries do not re-export `routes`.
The template’s `routesEntry` scaffolds an app-owned root layout route so router-aware wrapping has an idiomatic home.

Lazy page modules MUST use React Router Data Mode named `export function Component` (not `export default`) so they typecheck with `lazy: () => import('…')`.

Migrating docs cover Static App and Older / Webpack SSR App; not under `docs/migration-guides/`.

Migrating MUST cover:

- named `Component`
- `routesEntry` + flat `routes` + optional `sites` + `getSite` (required when config has >1 site; fail closed on unknown / non-string site; sole config site when omitted on single-site)
- multi-site membership via `sites` on routes (optional language path params, union tree + allowlist, or sku host matching as the product story)
- webpack dual-port → Vite SSR single `port` (reject `serverPort`; `PORT` still overrides prod)
- `dist/server/server.js` + sibling `client/`/`server/`
- CJS interop for `sku start`
- Express 4 typing (shared sku major; no Express 5 in this change)
- React Router 8 as optional peerDependency `^8` for Data Mode / route typing (Vite SSR template/fixtures install it)
- move off config `public` / public assets folder (import assets instead)
- that `dangerouslySetViteConfig` is unsupported (hard-error; raise use-cases via sku-support)
- server-only loaders vs client route graph (+ explicit `moduleId` when needed)
- prefer render-time data loading with dependencies from `Providers`; loaders for waterfalls / document redirects / headers / opt-in `getContext` DI
- Apollo apps: replace two-pass `getDataFromTree` with a streaming transport over `useInsertHtml`, provider in dual-entry `Providers`, nonce via `extraScriptProps`
- optional dual-entry named `Providers` outside the router (not returned from getters / `onHydrate`, not a route), vs router-aware wrapping in the app’s own root layout route
- optional dual-entry `getContext` patterns (Data Mode vs Framework Mode); red warning against putting Express `req` in `RouterContextProvider`
- Express `Request` module augmentation for middleware-appended fields (`express-serve-static-core`; shared by `middleware` / getters / server `getContext`)
- sync named getters (`getSite` / `getLanguage` / `getClientContext`) replacing `onRequest`; optional `middleware` / `onHydrate`
- Braid reset-before-Braid on `sku start` (Braid apps; no sku auto-inject)
- client-only providers / client-entry-only `Providers` for `window`-touching libraries
- Jest → Vitest prerequisite (link existing docs / codemod)
- `#` pathAliases / migrate-root-resolution for bare `src/…`
- sku-owned `@vocab/vite` resolve (no consumer pin for `@vocab/vite/runtime`)

#### Server-only loaders vs client route graph

Because `routesEntry` is imported into both graphs, dynamic imports inside it (e.g. `import('./loadHomeData')`) can pull server-only modules into the client build.

Keep server-only loader modules off the client-imported graph (e.g. separate `*.server.ts` pages / avoid attaching those loaders on the shared tree).

When the lazy factory is no longer a bare `() => import('./home')`, set `handle.moduleId` explicitly so modulepreload still works.

Do **not** ship an automatic `*.server.ts` client strip in this change — convention + docs only.

Prefer not to rely on server-only loaders for page content — see data-loading guidance below.
With Express `req` on getters / `getContext`, prefer projecting isomorphic values rather than env-split route trees.

#### Braid reset evaluation order (`sku start`)

On `sku start`, Vite’s SSR module graph can evaluate a loader → page → Braid before `App.tsx`’s `import 'braid-design-system/reset'`, throwing “Braid components imported before reset.”

Production build may succeed with a different order.

Apps that use Braid must ensure reset runs before any Braid-touching server module (e.g. top of `serverEntry` and any early-imported loader that pulls Braid).

Do **not** auto-inject Braid reset into sku’s Vite SSR server entry — Braid is optional per app.

#### Client-only providers during Document SSR

Providers that construct against `window` (e.g. analytics SDKs) throw during full-document SSR.

Webpack SSR often only mounted those on `#app` client hydrate.

Keep such providers out of the SSR tree — client-only wrappers (`useEffect` mount) or export `Providers` only from the **client** entry (omit on server) when those providers must not run during Document SSR.
When the SDK is also router-aware, keep the dependency in the client `Providers` and put the router-aware consumer in the app’s root layout route.

#### Jest → Vitest prerequisite

Vite SSR apps are expected to use `testRunner: 'vitest'`.

Migrating MUST call this out as a prerequisite and point at existing Vitest docs / `@sku-lib/codemod jest-to-vitest` / checklist (mock shapes, RTL, platform singletons).

No new Jest→Vitest codemod in this change.

#### Path aliases: bare `src/…` → `#src/…`

Webpack `baseUrl: '.'` allowed `import 'src/…'`.

Vite SSR `pathAliases` require `#` subpath imports.

Migrating MUST point at `pathAliases` + the existing `migrate-root-resolution` codemod / changelog guidance.

### 21. Data loading guidance (docs-led)

Prefer **render-time** data loading in React for page content:

- Inject an env-specific API / Experience client via the dual-entry `Providers` (request-scoped values arrive as `site` / `clientContext` props — not a new component from a getter, not consumer-authored Async Local Storage).
- Fetch in the React tree with Suspense (e.g. `useQuery`) so the same components work on SSR and client navigations.
- When the client has a cache that must survive the stream (Apollo), pair it with a streaming transport over `useInsertHtml` — see Decision 21a.

Rationale: portable shared UI without per-app loader wiring; aligns with streaming Document and isomorphic backends.

Reach for React Router **loaders** when you need to:

- start work before the suspending subtree renders (waterfall / parallelisation), or
- issue a real **document** `redirect()` / response headers (`Cache-Control`, `Set-Cookie`, …), or
- advanced DI via optional dual-entry `getContext` (same `createContext` keys on both sides).

`<Navigate />` on static initial render is a no-op — it is not a document HTTP redirect.

Loaders receive a Fetch `Request`, not Express `req`. Sku does **not** make Express `req` the loader `request` argument.

#### Data Mode vs Framework Mode `getLoadContext`

Sku is **Data Mode**, not Framework Mode:

|                    | Framework Mode                     | Sku Data Mode                                                              |
| ------------------ | ---------------------------------- | -------------------------------------------------------------------------- |
| Server seed        | Adapter `getLoadContext(req, res)` | Entry `getContext({ request, req })` into `query(..., { requestContext })` |
| Client nav loaders | Often still server (`.data`)       | Browser via `createBrowserRouter`                                          |
| Client seed        | Needed for client-only paths       | Needed for **every** client nav if context DI is used                      |

Copying **only** Framework’s server-half adapter into sku leaves client-nav loaders without context. If loader context is offered at all, prefer dual entry.

Document clearly:

- Server seeds from Express middleware bag + Fetch `request`; client seeds from browser-visible state (`clientContext`, cookies, memory, etc.).
- Cadence: server once per document `query`; client every nav/fetcher.
- Relation to Express `middleware` vs RR route `middleware` vs entry `getContext`.
- Relation to dual-entry `Providers` (component dependencies, outside the router) vs the app’s root layout route (router-aware wrapping) vs `getContext` (loader/action DI) — they compose; getters / optional `onHydrate` are for site / language / `clientContext` / hydrate side effects, not for returning wrappers.

**Red warning (MUST ship in product docs):** never put Express `req` (or other non-isomorphic platform objects) into `RouterContextProvider`. Project **values** / isomorphic-capable dependencies that both server and client `getContext` can supply. Raw `req` is `undefined` on client navs and becomes a landmine.

**Required docs example:** client `getContext` (or a loader using context) loading data for a **different location than the initial SSR location** — after client navigation — showing the client seed must work without Express and must not assume document-SSR-only state (e.g. user/logger from `req` on server; re-derived on client; navigate; loader still gets context).

Product + Migrating docs MUST encode this hierarchy and rebalance any wording that implied loaders are the default for content.

### 21a. Streaming data transports: `useInsertHtml`

Render-time data loading (Decision 21) is only credible if a real client cache can survive the stream.
Apollo Client is the case that matters for sku consumers, and its streaming hydration is a critical adoption requirement: queries that ran during SSR must populate the browser cache instead of refetching, while queries issued after hydration still fetch normally.

Every streaming transport works the same way — serialize query events during SSR and inject them as `<script>` chunks **between** React's stream chunks, so they execute before hydration.
`@apollo/client-react-streaming`'s `buildManualDataTransport` therefore requires one thing from the framework: `useInsertHtml(): (callback: () => ReactNode) => void`.
Next.js satisfies it with `ServerInsertedHTMLContext`; Apollo's own Vite example satisfies it by having the server harness create a transform stream and pass `injectIntoStream` down through app-owned context.

Sku owns `renderToPipeableStream` and the response pipe, so an app cannot reach the stream at all.
This is the same argument that justifies `Providers` (Decision 12a): sku owns the render call, so the seam has to be sku's.

**Sku owns:** a render-scoped injection queue, a React context carrying `insertHtml`, flushing queued nodes into the byte stream at chunk boundaries, and the `useInsertHtml` hook.
**Apps own:** the transport and the client (`WrapApolloProvider(buildManualDataTransport({ useInsertHtml }))`), mounted as dual-entry `Providers`.

Sku ships no Apollo dependency, provider, or config. The seam is transport-agnostic.

```tsx
// app-owned, shared by both request entries
import { useInsertHtml } from 'sku/ssr';
import { WrapApolloProvider } from '@apollo/client-react-streaming';
import { buildManualDataTransport } from '@apollo/client-react-streaming/manual-transport';

export const ApolloProvider = WrapApolloProvider(
  buildManualDataTransport({ useInsertHtml }),
);
```

`useInsertHtml` lives on `sku/ssr` next to `usePreloadRoute`: the app's transport module is imported by **both** graphs, so the export must be browser-safe, and the main `sku` entry must stay free of the optional `react-router` peer.
Module identity holds by the same `unbundle: true` mechanism that makes `getCspNonce` and the preload registry work — sku's `render` and the consumer's `sku/ssr` import resolve to one instance of the context module.

**Contract:**

- During document SSR, the returned function queues `() => ReactNode` for the current render.
- Sku renders queued nodes to static markup and writes them into the response **before the next React chunk**, and flushes any remainder at stream end. Injection therefore lands after the shell but before hydration runs.
- Anywhere there is no sku SSR render around it — the client graph, the development `Providers` markup probe — it is a silent no-op. It MUST NOT throw. Apollo's Next.js implementation throws on a missing context; sku's must not, or the probe in `warnIfServerProvidersRenderMarkup` would break every app using a transport.
- Under `handle.waitForAll`, injection still happens; the whole document is buffered to `onAllReady` and written in order.

**CSP:** injected script bodies are not known when headers are derived from the shell, so they cannot be hashed — they MUST carry the nonce.
`buildManualDataTransport` supports this through the wrapped provider's `extraScriptProps`, and `render` already mints a nonce before `pipe`, so `'nonce-…'` is in `script-src` for every Vite SSR document.
The server entry passes `extraScriptProps={{ nonce: getCspNonce() }}`; the client entry omits it.
Server-only `getCspNonce` stays on the main `sku` entry — only the transport module is shared.

**`Providers` DOM rule holds.** The wrapped provider is context-only; the script tags come out of the injection callback and are written by sku, not rendered by `Providers`. So Decision 12a's identical-DOM requirement is satisfied without an exception.

**Hydration ordering is already safe.** Injected scripts arrive after sku's `bootstrapModules` tag in document order, but module scripts are deferred and the transport's late-initializing queue starts life as a plain array (`window[…].push` before the reader exists), so nothing is dropped.

**Why not `@apollo/client-integration-react-router`:** it is alpha, peers `react-router@^7` (sku is on 8), and its `apolloLoader` / `preloadQuery` path returns transported query refs that carry a promise chain (`promiscade`) through loader data.
Sku serializes loader data as JSON and promise-scrubs it (Decision 19), so those refs cannot survive hydration without streaming (turbo-stream) loader data — a much larger change, and one that would pull sku toward Framework Mode.
Its `ApolloHydrationHelper` needs only `useMatches`, so it would work in Data Mode, but it exists to revive loader-transported refs and is unnecessary on the render-time path.
Render-time `useSuspenseQuery` under the app's provider is the supported path, which is where Decision 21 already points.

**Why not depend on Apollo's `stream-utils`:** `createInjectionTransformStream` is a Web `TransformStream` built for `renderToReadableStream`, and sku uses `renderToPipeableStream` with Node streams. Sku implements the equivalent Node transform itself and stays transport-agnostic.

**Rejected alternatives:**

| Approach                                      | Why not                                                                                                             |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `insertHtml` as a server `Providers` prop     | Every app re-creates the same context to reach a module-scope `buildManualDataTransport`; unavailable to route code |
| Async Local Storage instead of React context  | Decision 13 keeps ALS to the nonce; resumed suspended work is not reliably inside the render's ALS scope            |
| Sku owning an Apollo provider / config option | Sku would own a client lifecycle, link chain, and cache config it cannot version independently                      |
| Sku auto-adding the nonce to injected scripts | Sku does not render those nodes' props; `extraScriptProps` is already the transport's supported channel             |
| Two-pass `getDataFromTree`                    | Incompatible with streaming; the pattern Vite SSR exists to replace                                                 |

### 22. Experimental first release

Docs warning + changeset: available for testing, not for production.

No runtime experimental gate.

### 23. CJS default-export interop (docs only)

Keep existing `vite-plugin-cjs-interop` + `__UNSAFE_EXPERIMENTAL__cjsInteropDependencies` and Apollo-only baked defaults.

Do **not** expand sku’s default interop list for this change.

Document the start-vs-build failure mode (“Element type is invalid … got: object”) and how to extend the config list, with common open-source offender examples.

Do **not** rewrite or wrap React render errors at runtime — docs are enough.

### 24. Express 4 (shared) + React Router 8 (optional peer)

Vite SSR mounts consumer middleware into sku’s **shared** Express app — the same `express` / `@types/express` dependency webpack SSR and `sku serve` use.

This change keeps that major on **Express 4**. It does **not** upgrade Express 4 → 5.

A single Express major cannot be Express 5 for Vite SSR and Express 4 for webpack SSR without splitting the package. Upgrading would be a breaking change for webpack SSR middleware / `onStart` / `devServerMiddleware` and related typings.

Static Vite is unaffected (Connect), but webpack SSR is in the blast radius.

Vite SSR targets **React Router 8** via an **optional peerDependency** `react-router: ^8` (not a hard sku dependency). RR is Vite SSR–scoped and is not shared the way Express is.

Vite SSR template and fixtures install React Router 8. Webpack / static apps do not need it and MUST NOT be forced onto RR8 by this change (do not bump webpack fixtures solely to RR8).

Sku MUST NOT ship Jest transforms for `react-router` / `cookie-es` / `import.meta` in this change. Vite SSR requires Vitest; React Router 8 + Jest for webpack consumers is out of scope.

Document Express 4 for middleware typing (`middleware` / `SkuSsrMiddleware`) and React Router 8 for Data Mode / route typing consumers rely on.

Document Express `Request` module augmentation (`express-serve-static-core`) so middleware-appended fields type-check in `middleware`, the getters, and server `getContext` — same pattern as sku’s `getCspNonce` augmentation.

Align any React Router 8 peer baselines sku already owns (Node / React / Vite) where the catalog or engines need a bump; do not expand sku’s supported React range solely for packages that still support React 18 unless required by the upgrade.

Sku owns the Express app that mounts consumer middleware and the React Router Data Mode wiring for Vite SSR.

Those packages are not opaque transitive deps — their majors are part of the Vite SSR product contract (Express via the shared sku server; React Router via Data Mode peer + consumer install).

Keep majors pinned in docs and release notes; call out major bumps in changesets as potentially breaking for Vite SSR consumers.

**Breaking-change policy (later releases):** bumping the Express or React Router major that Vite SSR integrates may be a breaking change.

Consumer `middleware` / `devServerMiddleware` mount into sku’s Express app, and consumer routes/entries use React Router Data Mode APIs (`routes` + optional `sites`, `lazy` + named `Component`, loaders/actions, etc.).

Minor/patch upgrades within the documented major remain non-breaking when APIs stay compatible.

**Deferred:** Express 5 as a separate sku-wide breaking change (webpack SSR + Vite SSR + `sku serve` together). Jest support for React Router 8 (if ever needed for webpack) is a separate concern.

## Risks / Trade-offs

| Risk                                    | Mitigation                                                                                                                                                                    |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dual `routes` hydration mismatch        | Eliminated by first-class `routesEntry` (one module in both graphs); no runtime tree checker                                                                                  |
| Wrong-site tree / foreign path match    | Pre-filter `sites` into per-site trees before RR; `getSite` (or sole config site) selects; serialize `site` for client; fail closed on invalid/unknown site                   |
| App omits or invents `site`             | Non-empty config `sites`; multi-site requires `getSite` at init; hard-error if return is non-string or not a config site name; single-site uses sole name when getter omitted |
| Duplicate parse across getters          | Accepted; docs say keep getters sync/pure; shared libs memoise on `req`                                                                                                       |
| Accidental site splits                  | No `sites` inheritance; site-specific routes must set `sites` explicitly                                                                                                      |
| Shell-only CSP / late scripts           | Lazy single nonce; hash known bootstrap bodies                                                                                                                                |
| Absolute/`CDN` `publicPath`             | Config rejects; relative-only docs; no browser e2e for this edge case                                                                                                         |
| `publicPath` coupled to basename        | Never pass `publicPath` as RR basename; bake `__SKU_PUBLIC_PATH__`; fixture for `/static/...` assets                                                                          |
| Start vs prod asset URLs                | Start: Vite graph at `/`; build/prod: `base` + static mount under `publicPath` (webpack start parity)                                                                         |
| Unhashed `public` folder assets         | Hard-error if `paths.public` exists; disable `publicDir` / `copyPublicFiles` for Vite SSR; Migrating + docs                                                                   |
| `dangerouslySetViteConfig` on SSR       | Hard-error when set; omit decorator plugin on SSR graph; docs + sku-support for use-cases                                                                                     |
| CJS “got: object” on `sku start`        | Docs; consumer extends interop list (no new defaults; no runtime error rewrite)                                                                                               |
| Mock deps ship in prod                  | `devServerMiddleware` only; never from server entry                                                                                                                           |
| Early production use                    | Experimental docs + changeset                                                                                                                                                 |
| Express / RR major drift                | Keep shared Express on 4; RR 8 optional peer for Vite SSR only; docs + changeset mark later major bumps as potentially breaking; Express 5 deferred                           |
| RR 8 peer baselines                     | Optional peer `^8`; align engines with RR 8 minimums sku already can meet; document consumer React/Node expectations; template installs RR 8                                  |
| Jest + RR 8 (webpack)                   | Out of scope: no Jest transforms in this change; Vite SSR requires Vitest; do not force webpack fixtures onto RR 8                                                            |
| Server loaders leak to client           | Migrating: split server-only modules; explicit `moduleId` when lazy is non-idiomatic                                                                                          |
| Braid reset before Braid on start       | Docs: reset early on server graph; no sku auto-inject                                                                                                                         |
| `window` providers in Document SSR      | Migrating: client-only wrappers or client-entry-only `Providers`                                                                                                              |
| Jest apps on Vite SSR                   | Migrating: Vitest prerequisite; link existing vitest docs / codemod                                                                                                           |
| Nested `@vocab/vite/runtime`            | Sku `createRequire` + `resolve.alias`; validate translations Vite SSR without consumer pin                                                                                    |
| Bare `src/` imports under Vite          | Migrating: `#` `pathAliases` + migrate-root-resolution                                                                                                                        |
| Per-request `createStaticHandler`       | Providers render outside the router so sku never wraps the tree; pre-build handler per site at init; assert `render` does not import `createStaticHandler`                    |
| Server/client `Providers` DOM drift     | Context-only providers documented; dev-mode warning when entry `Providers` render hydration-relevant markup                                                                   |
| Express `req` stuffed into context      | Red warning: project values via dual `getContext`; never put raw `req` in `RouterContextProvider`                                                                             |
| Framework-only `getLoadContext` copy    | Dual entry required for Data Mode client navs; server-only API is a non-goal                                                                                                  |
| Server-only loaders as default          | Docs steer render-time content loading; loaders for waterfalls / document redirects / headers / opt-in getContext DI only                                                     |
| Start FOUC without SSR-CSS              | Document `assets.css` gets virtual stylesheet on `sku start`; production stays on manifest CSS                                                                                |
| Telemetry missing on Vite SSR start     | Mount `telemetryPlugin` on SSR graph; client scripts via client entry / bootstrap; mark `initialPageLoad` on ready                                                            |
| Apps cannot reach the stream            | `useInsertHtml` on `sku/ssr`; sku flushes queued nodes between React chunks; `stream-insert-html` fixture proves Apollo hydration end to end                                  |
| Transport scripts blocked by CSP        | Injected bodies are unhashable post-shell; nonce already minted before `pipe`; docs show `extraScriptProps={{ nonce: getCspNonce() }}` on the server entry                    |
| `useInsertHtml` throws off the SSR path | Silent no-op with no injection context — client graph and the dev `Providers` markup probe included; covered by tests                                                         |
| Duplicate queries after hydration       | Fixture asserts server-run queries are served from the transported cache and that a post-hydration query still fetches                                                        |
| Wrong transport build resolved          | Apollo ships separate `browser` / `node` condition builds and asserts on mismatch; fixture exercises both `sku start` and production                                          |
| Injection lost under `waitForAll`       | Buffer to `onAllReady` and write injected nodes in stream order; covered by tests                                                                                             |
| Transport module duplicated in graph    | `useInsertHtml` context lives in one module resolved by both sku's render and `sku/ssr` (`unbundle: true`), as with `getCspNonce` / preload registry                          |

## Migration Plan

Opt-in via `buildType` + Vite.

New apps: `--template vite-ssr` (named `Component`).

Existing: Migrating docs (ports, deploy layout, CJS, Express 4, React Router 8 optional peer, `Component`, `routesEntry` + flat `routes` + optional `sites` + `getSite`, named getters replacing `onRequest`, optional `middleware` / `onHydrate`, named `Providers` + app-owned root layout route, move off `public`, data-loading hierarchy + getContext + red warning, Apollo streaming transport via `useInsertHtml` instead of `getDataFromTree`, server-only loaders, Braid reset order, client-only providers, Jest→Vitest, `#` pathAliases, sku-owned `@vocab/vite`).

Webpack SSR: leave `buildType` unset.

Rollback: remove `buildType`.

## Open Questions

- **Custom logger for setup behaviours?** Until decided, production Vite SSR does not add listen logging.
- **Does client `getContext` receive `{ clientContext }` or stay zero-arg?** RR native is zero-arg; sku may wrap if injecting `clientContext` — decide at apply time without changing the dual-export shape.
