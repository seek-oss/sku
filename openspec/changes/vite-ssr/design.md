## Context

SSR commands are blocked today.
Webpack SSR uses Express `renderCallback`, string HTML, and CSP meta tags.

This change introduces **Managed Data Mode**.
Sku owns the server, Document shell, streaming/hydration, assets, and CSP headers.
Sku wires React Router Data Mode for routing and data.
Apps own routes, data, and providers.

Managed Data Mode is first shipped as **SSR** (`buildType: 'ssr'` on Vite).
The same application contract is intended to underpin a future Static path.
That contract includes `sku/runtime`, request entries, and hooks.
Render strategy and API surface are separate concerns.
See Decision 27.

## Goals / Non-Goals

**Goals:**

- **Managed Data Mode** first shipped as SSR via `buildType: 'ssr'`.
- Public import `sku/runtime`.
- Public types and symbols without an `Ssr` infix.
- Create template `ssr`.
- First-class `routesEntry` with a named `routes` export.
- First-class request-entry contracts.
- First-class multi-site route trees via flat `routes`, optional `sites`, and `getSite`.
- Same spirit as first-class multi-language.
- Full-document streaming with `hydrateRoot(document, …)`.
- Shell-derived CSP headers.
- Per-route and vocab chunks via sku-owned `@vocab/vite` resolve.
- Create template and Migrating docs.
- Experimental first release.
- Single config `port` only.
- Config `serverPort` is rejected.
- Named `Component` on lazy pages in template and docs.
- CJS interop docs.
- Accurate config JSDoc.
- React Router 8 as an optional peerDependency `^8` for SSR consumers only.
- No hard sku dependency on React Router.
- Keep the shared Express dep on 4.
- No 4 → 5 bump in this change.
- No Jest transforms for React Router 8 in this change.
- SSR requires Vitest.
- Request entries `export default` one object via `defineServerEntry` / `defineClientEntry`.
- Those helpers are zero-runtime inference helpers.
- Optional sync getters receive Express `{ req }` where needed.
- Getters include `getSite`, `getLanguage`, `getClientContext`, and `getReactContext`.
- Optional entry hooks include `middleware`, `onListen`, `onHydrate`, and `getRouterContext`.
- Always-on sku `SkuProvider` outside the router.
- It carries `site`, serialised `clientContext`, and env `reactContext`.
- Typed hooks via `createSkuContexts<typeof server, typeof client>()` on `sku/runtime`.
- Sku does not wrap the route tree.
- `createStaticHandler` is pre-built per site.
- Three value channels: `getClientContext`, dual-entry `getReactContext`, and dual-entry `getRouterContext`.
- `getClientContext` is the serialised isomorphic React seed.
- `getReactContext` may differ per environment.
- `getRouterContext` supplies values for React Router loaders and actions.
- Later getters receive already-resolved sibling values.
- `defineServerEntry` infers types from getter returns.
- `defineClientEntry<typeof server>` extracts `Site` / `ClientContext` from the server entry.
- Hooks read types from `typeof` the entry objects.
- Router-aware isomorphic wrapping lives in the app’s own root layout route in `routesEntry`.
- That covers Vocab, Apollo provider mount, and page chrome.
- App-owned streaming data transports via `useInsertHtml` on `sku/runtime`.
- The hook is nonce-able and a no-op off the SSR path.
- Apollo streaming hydration is proven by a fixture.
- Server-run queries are not refetched on hydrate.
- Post-hydration queries still fetch.
- Docs prefer render-time React data loading via Suspense.
- Clients come from `useReactContext` / `useClientContext`.
- Router-aware providers live in the app’s root layout route.
- Loaders and `getRouterContext` are opt-in.
- Docs include a red warning against putting Express `req` into router context.
- Migrating guidance covers server-only loaders, Braid reset order, client-only libraries via `getReactContext`, Jest → Vitest, and `#` `pathAliases`.
- Config `polyfills` applies to the SSR browser client.
- SSR `sku start` covers SSR-CSS via a virtual stylesheet on Document assets.
- No `transformIndexHtml` on the SSR path.
- SSR `sku start` telemetry parity for `start.initial` / `start.rebuild`.
- Optional server-entry `onListen` covers the same post-`listen` window as webpack `onStart`.
- Opt-in config `expressTrustProxy` is a boolean that sets Express hop count `1`.
- The create template sets `expressTrustProxy: true`.

**Non-Goals:**

- Webpack mode for this `buildType`, or a Webpack SSR backfill / an updated Webpack-SSR create template.
- Converting the static `vite` create template.
- Full infra/deploy product guides (keep sku’s existing docs scope).
- Framework Mode / RSC.
- Absolute / `CDN` `publicPath`.
- First-class React Router basename config.
- SSR `serverPort`.
- Expanding baked-in CJS interop defaults beyond Apollo.
- Consumer Document override.
- Runtime server↔client route-tree equality checking.
- Dual-entry `routes` re-exports from `serverEntry` / `clientEntry`.
- Differing server vs client route modules as a product feature.
- Sku-owned site resolution from config `hosts` / `sites[].host` (local-dev listen/setup only).
- Sku-owned per-site path expansion libraries (apps own path shape; sku owns membership filtering).
- Requiring a non-empty config `sites` array for SSR (empty soft-defaults to `'default'`).
- Per-site JS bundles.
- Returning routes from a request-entry getter or bag.
- A combined request-entry resolver returning site + language + `clientContext` values (see Decision 12).
- Returning a provider component from request-entry getters (see Decision 12).
- Sku reading site / language / `clientContext` from a conventional `req` field, or a sku-provided push API such as `setRequestContext(req, …)`.
- Tolerating a missing `serverEntry` / `clientEntry` file (paths still resolve via normal module resolution).
- Per-getter named exports on request entries or `defineGet*` per-property helpers.
- Mounting sku’s provider inside the route tree as a pathless layout (see Decision 12).
- Consumer-authored Async Local Storage as the documented way to reach request state from React.
- App-authored dual-entry `Providers` / `SkuProvidersProps` (see Decision 12a).
- A public `useInitialLanguage` / language-in-React-context hook in v1.
- Union route tree + site allowlist middleware as the documented multi-site product story.
- Parent → child inheritance of `sites` (must set explicitly on each divergent route).
- Overloading config `routes` (static prerender path lists) as the SSR `RouteObject` entry.
- Sku-owned listen logging by default (apps log in `onListen`).
- An `onBeforeListen` server-entry hook (module top-level covers pre-bind setup).
- Soft-defaulting Express `trust proxy` for SSR without config (opt-in via `expressTrustProxy`).
- Supporting the config `public` assets folder for SSR (until a definitive need).
- Automatic `*.server.ts` client strip.
- Auto-injecting Braid reset into sku’s SSR server entry.
- A new Jest → Vitest codemod beyond existing tooling / docs.
- Making Express `req` the loader `request` argument (stays Fetch `Request`).
- Treating Framework Mode’s server-only `getLoadContext(req, res)` as sufficient for sku Data Mode.
- Requiring `getClientContext`, `getReactContext`, or `getRouterContext` (all optional; omit → `undefined` / empty defaults).
- Requiring `middleware`, `onListen`, or `onHydrate` (all optional).
- Requiring `getSite` when config has zero or one site (sku uses the sole resolved name).
- Passing Fetch `Request` into `getSite` / `getLanguage` / `getClientContext` (Express `req` only).
- Passing `res` into getters / `getReactContext` / `getRouterContext` in v1.
- Async request-entry getters (sync-only; `getRouterContext` MAY still be async because it seeds loader context).
- Treating raw Express `req` (or other non-isomorphic platform objects) in `RouterContextProvider` as a supported pattern.
- Shipping Jest support for React Router 8 (transforms / ESM interop).
- Forcing webpack fixtures or non–Vite-SSR apps onto React Router 8.
- Treating React Router loaders as the default teaching path for page content.
- Upgrading sku’s shared Express dependency from 4 → 5 (deferred; would break webpack SSR).
- Supporting `@sku-lib/vite/loadable` (Collector / `LoadableProvider` / `preloadPlugin` module-id injection) as an SSR document-preload source.
- Supporting `dangerouslySetViteConfig` or `vitePlugins` for SSR (static Vite unchanged).
- A sku-owned Apollo dependency, provider, config option, or version pin (sku ships `useInsertHtml` and apps own the client / transport).
- `@apollo/client-integration-react-router`’s loader transport (see Decision 21a).
- Streaming (turbo-stream) loader-data serialization to carry transported query refs.
- Two-pass `getDataFromTree` SSR (incompatible with streaming).
- Sku auto-attaching the CSP nonce to app-injected scripts (transports expose their own script props).
- Consumer Vite config injection for SSR module identity (sku owns `optimizeDeps.exclude`).
- Moving Document / route filtering / middleware / stream transform onto the public `sku/runtime` entry (not on the consumer↔sku dual path).

## Decisions

### 1. Webpack alignment principle

When choosing SSR implementation details that overlap webpack SSR (compile-time defines, naming, shapes), two rules apply.
Do not copy webpack SSR patterns that are a poor fit for SSR.
Do not diverge from webpack SSR naming or shapes without a concrete reason.

Prefer webpack-aligned defines (`__SKU_CSP__`, `__SKU_DEFAULT_SERVER_PORT__`) over inventing parallel `import.meta.env.SKU_*` knobs.
Prefer a single CSP object over many flat string defines.
Prefer dropping unused language allowlisting over baking `SKU_LANGUAGES` “because config exists.”
No sidecar runtime manifest.
Webpack-style defines are enough.

### 2. Mode selection via `buildType`

`buildType?: 'ssr' | 'static'` selects render strategy.
With Vite the commands stay `sku start` / `sku build`.
Webpack + this `buildType` MUST error, and `-ssr` when `buildType` is set MUST error.
Webpack SSR without `buildType` keeps `start-ssr` / `build-ssr`.

### 3. Managed Data Mode (Data Mode, not Framework Mode)

Sku’s application contract is **Managed Data Mode**.
Sku owns Document, the Node server, streaming/hydration bootstrap, CSP, and React Router Data Mode wiring (`createStaticHandler` / `createBrowserRouter` + `lazy`).
Apps own routes, data, and providers.
Errors flow through React Router `ErrorBoundary` + `context.statusCode`.

This is **not** React Router Framework Mode (no RR Vite plugin, no file routes, no RSC).
Sku owns Vite plugins, the Node server, and CSP, so Framework Mode’s Vite plugin would compete.

Managed Data Mode is the temporal product descriptor for this API surface when comparing to older sku APIs (webpack SSR `renderCallback` + string document, today’s static `#app` hydrate).
It is first released as SSR.
A future Static path is expected to share the same Managed Data Mode contract (see Decision 27).

### 4. `routesEntry` + request entries

Reuse `serverEntry` / `clientEntry` for request lifecycle.
Add first-class config `routesEntry` (default `src/routes.tsx`) for the route tree.
Sku resolves it via `__sku_alias__routesEntry` into **both** the server and client Vite graphs (same alias pattern as `__sku_alias__serverEntry` / `__sku_alias__clientEntry`).

`routesEntry` MUST export named `routes: SkuRouteObject[]`.
`SkuRouteObject` is a sku type helper only: `RouteObject & { sites?: string[] }`.
Sku MUST NOT re-export a wrapped React Router `RouteObject` as the product API.
Consumers still import route primitives from `react-router` and may use `SkuRouteObject` for the optional `sites` field.

Missing or non-array `routes` on `routesEntry` MUST hard-error.
Sku loads `routes` from `routesEntry` only.
It does not read `routes` / `routesBySite` from `serverEntry` / `clientEntry`.
Config `routes` (static prerender path lists) remains unrelated.
Do not overload that key for SSR `RouteObject` trees.

`serverEntry` / `clientEntry` each **`export default`** one object from `defineServerEntry` / `defineClientEntry` (structural types `SkuServerEntry` / `SkuClientEntry`).
Sku reads that default export and calls optional properties.

The server object exposes optional sync `getSite` / `getLanguage` / `getClientContext` / `getReactContext`, plus optional `middleware`, `onListen`, and `getRouterContext`.
The client object exposes optional `onHydrate`, `getReactContext`, and `getRouterContext`.
`getSite` is required **only** when config `sites` has more than one entry.
A missing property then hard-errors at init (same class as missing `routes` on `routesEntry`).

Optional properties omitted mean noops / defaults.
No consumer middleware, no hydrate side effects, sole resolved site name when `getSite` is omitted on a 0–1 site app (empty config soft-defaults to `'default'`), and `clientContext` / `reactContext` `undefined`.
Hard errors apply only when a required property is missing.
There is no early file-existence gate.
Missing entry files fail via normal module resolution.

Getters on the entry object stay **pull** (functions sku calls) rather than an `onRequest`-style bag of already-resolved values.
Sku always mounts `SkuProvider` outside the router (`Document` → `SkuProvider` → router) with `site`, `clientContext`, and `reactContext`.
Dual-entry `getReactContext` supplies values that may differ on server vs client.
Dual-entry `getRouterContext` supplies values for React Router loaders/actions.
Client `getRouterContext` must be a stable function called on every client navigation / fetcher by `createBrowserRouter`.

One `routesEntry` module is the isomorphic source of truth for both graphs.
No dual re-export.
No “implementations MAY diverge” escape hatch as a product feature.
With Express `req` on the getters plus optional `getReactContext` / `getRouterContext`, shell and loader values no longer need env-split route modules.
Server-only loader modules remain a docs/convention concern (keep them off the client-imported graph, no automatic `*.server.ts` strip).

SSR wrappers resolve consumer modules via `__sku_alias__serverEntry` / `__sku_alias__clientEntry` / `__sku_alias__routesEntry`.

Note: tsdown/rolldown reorders static imports by specifier shape.
`#…` sorts after `@vitejs/plugin-react/preamble` while `__…` sorts before it.
Using `#` entry ids can therefore surface the fragile “preamble must run before consumer JSX” Refresh ordering issue in the published client entry.
Mitigate with a start-only `#entries/ssr-client.dev` that imports the preamble then dynamically loads the production client entry.
Production builds keep using `#entries/ssr-client` with no preamble.

**Config `polyfills` (browser client):**
Sku’s SSR client entry (`ssr-client.tsx`, including the start-only `.dev` wrapper’s production client load) MUST import `virtual:sku/polyfills` before hydrate and before consumer client-entry code.
It is the same virtual module as static `vite-client.tsx`.
`polyfillsPlugin` remains on the shared Vite plugin graph.
It is not static-only.
Without that import the plugin is inert for SSR.
Polyfills apply to the **browser** client graph only.
Do not load them into the Node server entry.

**HTTP middleware layers** (distinct from React Router route `middleware`):

- **Production:** optional server-entry Express/Connect `middleware`. Omitted ⇒ no consumer middleware layer (not an error). Mounted in start and production when present.
- **Dev-only:** optional config `devServerMiddleware`. Start only, never in the production server graph.
- **Production order:** request-context → optional `express.static(publicPath)` (only when a sibling `client/` exists) → server-entry `middleware` (if any) → HTML.
- **Dev order:** request-context → `devServerMiddleware` → server-entry `middleware` (if any) → Vite → HTML.

Document is sku-owned (React document metadata).
No consumer Document override in v1.

### 4a. Flat `routes` + optional `sites` → pre-built site trees

Multi-site apps need different React Router path sets per site (e.g. site-only pages).
A single unfiltered `RouteObject[]` either over-matches unsupported paths or registers foreign paths on every host.

Config `hosts` / `sites[].host` are **local-dev listen and setup-hosts only**.
Sku MUST NOT derive production (or request) site from them for route-tree selection.

**Apps own** site resolution (from Express `req`, headers, app config, etc.) via sync `getSite({ req })`, and per-site **path shape** when paths differ by site (factories remain fine for `/jobs` vs `/emploi`).
Route membership is declared on routes themselves.

**Sku owns:**

- Typing `SkuRouteObject.sites`.
- Loading `routes` from `routesEntry`.
- Pre-building per-site trees from config site names.
- Stripping `sites` before passing trees to React Router APIs.
- Creating `createStaticHandler` once per site at init. Sku never wraps the tree because provider mounting sits outside the router.
- Selecting that handler for the resolved `site`.
- Serialising `site` into the hydrate bootstrap.
- Using that same `site` on the client for `createBrowserRouter`.

**Route membership:**

- `routesEntry` exports flat `routes: SkuRouteObject[]`.
- Optional `sites?: string[]` on a route. Omit or `undefined` ⇒ route is included for **every** config site.
- Present `sites` ⇒ route is included **only** for those site names (exact string match against config site names).
- No parent → child inheritance of `sites`. Site-specific deviation MUST set `sites` explicitly on each divergent route. Friction is intentional.
- The tree walk stays recursive: if a parent is excluded for a site, that parent’s subtree is absent from that site’s tree (structure, not field inheritance).

**Config sites:**
SSR does **not** require a non-empty config `sites` array.
Empty or omitted `sites` soft-defaults to a single synthetic site name `'default'` for pre-build + allowlist (same class as other sku empty-config soft paths).
Apps that care about site names declare real ones.
Multi-site still needs ≥2 configured names + `getSite`.

**Pre-build:**
At init (not per request), for each resolved site name (config names, or `['default']` when empty), sku deep-filters `routes` into a site tree and strips `sites` from the objects passed to React Router.
The client needs the same site-name list (bake from config for production client, same as other `__SKU_*` defines) so both sides pre-build identically from the same `routesEntry` module.

**Resolve site:**

- Zero configured sites (soft-default `'default'`) or one configured site ⇒ sku uses that sole resolved name when `getSite` is omitted. If `getSite` is exported, sku still calls it and validates the return against the resolved name list.
- Multiple configured sites ⇒ missing `getSite` export is a **hard error at init** (names the export; same treatment as missing `routes` on `routesEntry`).
- Non-string `site` from `getSite`, or a `site` not among resolved site names / no pre-built entry ⇒ **fail closed** per request (hard error).

**Select tree / handler:** the pre-built tree (and server `createStaticHandler`) for that `site`.
The client uses the same `site` for `createBrowserRouter`.
Do **not** call `createStaticHandler` on the per-request hot path.
Only `query()` / `createStaticRouter` are per request.

`site` is first-class in the hydrate bootstrap.
It is not stuffed into `clientContext` and not passed into `onHydrate` args.
`onHydrate` stays `{ clientContext }` only (optional export).

Config `sites[].routes` (static prerender path lists) remains unrelated to SSR `RouteObject` trees.

**Why not alternatives as the product answer:**

| Approach                                  | Why not                                                                                                                      |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Sku host → site via config `sites[].host` | Config hosts are local-dev only; production hostnames are app/platform-owned                                                 |
| Union tree + site allowlist middleware    | Cross-site paths still match then 404; easy to get wrong on client nav; every migrant reinvents it                           |
| `routesBySite` map                        | Trialled and rejected; apps hand-build N trees; membership belongs on the route; sku can pre-filter a flat list              |
| Dual-entry `routes` re-exports            | Redundant once `getRouterContext` / getters cover request-scoped values; hydration mismatch risk; `routesEntry` is one truth |
| Getter / bag returns routes               | Weaker config-as-data; larger hydrate story; `routesEntry` stays clearer                                                     |
| Optional path params for “language”       | Matches unsupported prefixes; not site-correct                                                                               |
| One deploy/process per site               | Does not match multi-host deploys that share a process                                                                       |
| Inherit `sites` from parents              | Hides site splits; explicit annotation keeps deviation visible                                                               |
| Overload config `routes`                  | Already means static prerender path lists; keep `routesEntry` for the RR module                                              |
| Conventional `req` field / sku push API   | Unversioned `string \| undefined`; collides across consumers; fails only on a request — see Decision 12                      |
| Combined site+language+context resolver   | Reintroduces the return-bag shape Decision 12 pulled apart                                                                   |

Document multi-site SSR via `routesEntry` + flat `routes` + optional `sites` + `getSite`, not these workarounds.

### 5. Commands and deploy shape

Single-port Vite `middlewareMode` + `appType: 'custom'` powers `sku start` (listen on `port`).
Build emits sibling `client/` and `server/`.
The production entry is `dist/server/server.js`.
`httpsDevServer` turns on HTTPS + HMR in start.
Production remains HTTP.

Webpack SSR’s dual-port mental model (`port` for assets + `serverPort` for the Node app) does **not** apply.
SSR uses a single config `port` for `sku start` and as the baked production default listen port (`__SKU_DEFAULT_SERVER_PORT__`).
`process.env.PORT` still overrides at runtime.
Providing `serverPort` with SSR MUST fail config validation (webpack-only).
Migrating docs must call this out (drop `serverPort`, map old `serverPort` → `port` or rely on `PORT`).

**Production server self-containment (except hashed static files):**

Document asset URLs come from the Vite client manifest.

`sku build` MUST bake or copy the Vite client manifest into the server output.
The production entry MUST load that server-local manifest.
It MUST NOT require a sibling `client/` directory (or the hashed files under it) to start or stream HTML.

Hashed files under `client/` remain the static asset payload.
They are not part of the Node process’s required runtime graph.

The server bundle is **not** a frozen binary.
Runtime dependencies still resolve from `node_modules` (or an equivalent production install) next to the deployed app.
Deploy docs MUST say so.

**Recommended production layout:**

1. Run `sku build`.
2. Upload `dist/client/` (hashed assets) to persistent object storage or an equivalent edge/origin for static files.
3. Deploy `dist/server/` plus production `node_modules` (or `pnpm deploy` / image install equivalent).
4. Put a reverse proxy or CDN in front that serves `publicPath` from that storage and forwards everything else to Node.

Productionised services SHOULD NOT treat the Node process as the real origin for hashed assets.
A reverse proxy or persistent storage serves those files ahead of (or instead of) Node.

**Standalone / experimentation:**

Deploying sibling `client/` + `server/` and letting Node serve assets via `express.static` remains useful for local production smoke tests and edge cases.
It is not the recommended productionised path.
Deploy docs MUST distinguish the two.

### 6. `publicPath` is the static asset prefix only (not React Router basename)

`publicPath` is sku’s asset prefix.
It is the public URL path for static assets (webpack parity via `__SKU_PUBLIC_PATH__`).

**Production / `sku build`:**
Vite `config.base` is set to `publicPath` so emitted client URLs match.
HTML injects assets under `publicPath` using the **baked** client manifest (Decision 5).

When a sibling `client/` directory exists next to `server/`, the production server MAY mount `express.static` at `publicPath` **before** server-entry `middleware`.
That mount is for standalone / local production convenience.
It MUST NOT be required for Document rendering or process startup.

When no sibling `client/` exists, sku MUST NOT mount `express.static` for that prefix and MUST NOT fail solely because the directory is absent.

SSR requires relative `publicPath`.
Absolute / CDN `publicPath` remains rejected (Non-Goals).
Browser asset URLs stay same-origin under `publicPath`.
The edge layer (or standalone Node static) resolves those paths to files.

When Node static **is** mounted, static under `publicPath` wins over consumer middleware.
Do **not** treat `unlessStatic('/static/…')` (or equivalent) as the sku fix.
Migrants should not reinvent that for every catch-all stack.
Apps that intentionally intercept paths under `publicPath` are rare and own that routing (e.g. platform proxy), not sku’s default mount order.

**Start order is unchanged** for this decision (`… → middleware → Vite → HTML`).

**`sku start`:**
Ignore config `publicPath` and serve the Vite module graph from `/` (webpack SSR start parity).
Bootstrap scripts are `/@vite/client` and `/@fs/…`, not under `publicPath`.
Documents stay on app routes outside any asset prefix either way.

Sku MUST NOT treat Vite’s built-in `import.meta.env.BASE_URL` as a product concept or pass it (or `publicPath`) as React Router `basename`.
Basename stays unset (effectively `/`).
Path-prefixed SPA basenames are a discouraged pattern and MUST NOT become a first-class sku config.

Relative `publicPath` values like `/static/my-app` MUST work in production with app HTML served on routes outside that prefix.
Cover with a fixture or equivalent test (production asset prefix, start bootstrap at `/`).
Do **not** set Vite `config.base` to `publicPath` for `sku start`.
That conflates Vite’s app-root with sku’s asset prefix and breaks static SPA start when shared.

### 7. No config `public` assets folder for SSR

Config `public` designates a folder of files copied/served as-is (unhashed).
That pattern often bypasses content hashing / cache-safe URLs and is used to avoid production-ready asset serving.
Until there is a definitive need, SSR MUST NOT support it.

Config always has a `public` path (default `'public'`), so the signal is directory existence, not whether the option is set.
On `sku start` / `sku build` for SSR, if `paths.public` exists on disk, hard-error with guidance to import assets from scripts instead (Vite hashed pipeline).

Implementation MUST also disable the copy/serve path for this mode:

- Do **not** set Vite `publicDir` to `paths.public` (use `false` / unset for SSR).
- Do **not** call `copyPublicFiles` after the SSR build.

Static Vite and webpack keep today’s `public` behaviour.
Docs MUST discourage the pattern for SSR and note importing images/assets in modules as the alternative.
Migrating MUST call out moving off `public` when adopting SSR.

### 8. No `dangerouslySetViteConfig` or `vitePlugins` for SSR

`dangerouslySetViteConfig` and `vitePlugins` are Vite escape hatches.
Sku opens escape hatches only for known best-practice needs.
As a new API without legacy to support, SSR does not support these options.

When either is set with SSR, config validation MUST hard-error and point consumers to sku-support channels with their use-case.
Static Vite keeps today’s behaviour.
Do not apply the `dangerouslySetViteConfig` decorator plugin on the SSR plugin graph.
Do not mount consumer `vitePlugins` on the SSR plugin graph.
Both omissions are redundant once validation rejects, but keep the SSR path explicit.

Docs (`configuration.md` + SSR product / Migrating) MUST state that both options are unsupported for SSR and that exceptional Vite customisation needs should go through support first.

### 9. Full-document streaming

React owns `<html>`, `<head>`, and `<body>`.
Pipe on `onShellReady`.
Optional `handle.waitForAll` waits for `onAllReady`.
Abort on client disconnect.
Client hydrates via `hydrateRoot(document, …)`.

### 10. No `transformIndexHtml` on the SSR path

The React Refresh preamble is loaded via the client entry.
The Vite client and app entry come through `bootstrapModules`.
CSS and modulepreloads come from the manifest into Document.
State handoff uses a hashable `bootstrapScriptContent`.

Static Vite injects serve-only HTML (SSR-CSS link, telemetry clients) through `transformIndexHtml`.
SSR MUST NOT call `transformIndexHtml` on document responses.
Serve-only concerns that still apply to SSR `sku start` (SSR-CSS, telemetry) MUST inject via Document assets and/or the browser client entry / `bootstrapModules` instead.
See Decisions 10a and 10b.
Production CSS remains client-manifest → Document (unchanged).

### 10a. SSR-CSS on SSR `sku start`

`vitePluginSsrCss` collects CSS reachable from configured entries into `virtual:ssr-css.css` and (on static Vite) injects a `<link>` plus HMR cleanup via `transformIndexHtml`.

For SSR `sku start`:

- Mount `vitePluginSsrCss` on the SSR plugin graph with entries that reach CSS in the SSR module graph (consumer `serverEntry` and/or sku’s SSR server entry, not static’s `renderEntry`).
- Put the virtual stylesheet URL into Document `assets.css` so the existing `<link rel="stylesheet">` path emits it (no HTML transform).
- Move the HMR cleanup that removes stale `[data-ssr-css]` links onto a client-entry / bootstrap-module path (same “no `transformIndexHtml`” rule).
- Mark the Document link so cleanup can still target it (`data-ssr-css` or equivalent).

Production SSR MUST NOT rely on this plugin.
CSS comes from the client manifest.
Goal: avoid an unstyled flash on `sku start` until the client graph loads styles.

### 10b. Telemetry on SSR `sku start`

`telemetryPlugin` is serve-only (`apply: 'serve'`).
On static Vite it injects page-load + HMR client scripts via `transformIndexHtml` and wires Vite WS handlers / `handleHotUpdate`.

For SSR `sku start`:

- Mount `telemetryPlugin` on the SSR plugin graph with tags such as `type: 'ssr'` (parity with static’s `type: 'static'`).
- Deliver the page-load and HMR client scripts via the SSR browser client entry and/or a serve-only module in `bootstrapModules`. Not via `transformIndexHtml`, and not as new Document inline scripts (CSP already tracks `bootstrapScriptContent`).
- Mark `initialPageLoad` when the SSR dev server is ready (static does this in `middlewarePlugin.configureServer`). `skuStart.mark()` in `viteStartHandler` already covers both modes.
- Keep WS handlers + `handleHotUpdate` behaviour once the plugin is on the middleware-mode server.

Emit the same metrics as static start: `start.initial` and `start.rebuild`.

### 11. CSP: headers from shell

Derive `script-src` before `pipe`.
Support enforcing and/or Report-Only, each with an optional `report-to` (`cspReportTo` / `cspReportOnlyReportTo`).
Relative `publicPath` only (asset base; still covered by `'self'`).
No meta `http-equiv`.

**Coexistence with static Vite CSP (merged from master):**
Static Vite has `cspDelivery: 'tag' | 'header'` (meta vs `metadata.csp` JSON) and Report-Only via `createCSPHandler` → `metadata.cspReportOnly` / start-time headers.
That rendering path is separate from SSR, which keeps its own `buildCspHeaders` (real response headers, lazy single nonce).
Do not route SSR through `cspDelivery` or the static HTML CSP handler.

The `report-to` config surface is shared, however.
`createSkuContext` normalises `cspReportTo` / `cspReportOnlyReportTo` (endpoint name, URL, or tuple) into a `ReportingEndpoint` via `parseCspReportTo` from `utils/csp.ts`, and Report-Only falls back to the enforcing value.
SSR consumes those resolved endpoints, appends `report-to <endpoint>` to the matching policy, and emits a `Reporting-Endpoints` response header for whichever endpoints carry a URL.
That header is built with the shared `stringifyReportingEndpoints`.
Static writes the same value to `metadata.reportingEndpoints` instead.

### 12. Request-entry and routesEntry shapes

```ts
// sku public type (lighter option — not a wrapped RR re-export)
type SkuRouteObject = RouteObject & { sites?: string[] };

// routesEntry (config `routesEntry`, default `src/routes.tsx`)
export const routes: SkuRouteObject[];

// serverEntry — default export; getSite required only when config has >1 site
import { defineServerEntry } from 'sku/runtime';

export default defineServerEntry({
  getSite?(args: { req: Express.Request }): /* inferred Site */;
  getLanguage?(args: { req: Express.Request }): /* inferred Language */;
  getClientContext?(args: { req: Express.Request }): /* inferred ClientContext */; // JSON-serialisable
  getReactContext?(args: {
    req: Express.Request;
    site: /* NoInfer<Site> */;
    clientContext: /* NoInfer<ClientContext> */ | undefined;
  }): /* inferred ReactContext */; // MAY be non-JSON (apiClient, makeClient, …)
  middleware?: RequestHandler[];
  onListen?(args: {
    app: Express;
    httpServer: http.Server | https.Server;
    port: number;
  }): void | Promise<void>;
  getRouterContext?(args: {
    request: Request; // Fetch — same shape as query()/loaders
    req: Express.Request;
    site: /* NoInfer<Site> */;
    clientContext: /* NoInfer<ClientContext> */ | undefined;
    reactContext: /* NoInfer<ReactContext> */ | undefined;
  }): RouterContextProvider | Promise<RouterContextProvider>;
});

// clientEntry — default export; all properties optional
// Pass typeof the server entry so ClientContext / Site match getClientContext / getSite
import type server from './server.js';
import { defineClientEntry } from 'sku/runtime';

export default defineClientEntry<typeof server>()({
  onHydrate?(args: {
    clientContext: /* ClientContext from ServerEntry */ | undefined;
  }): void;
  getReactContext?(args: {
    site: /* Site from ServerEntry */;
    clientContext: /* NoInfer<ClientContext> */ | undefined;
  }): /* inferred ReactContext */;
  getRouterContext?(args: {
    site: /* Site from ServerEntry */;
    clientContext: /* NoInfer<ClientContext> */ | undefined;
    reactContext: /* NoInfer<ReactContext> */ | undefined;
  }): RouterContextProvider;
});
```

**Why getters on a default-exported object (not `onRequest`, not per-getter named exports):**

`onRequest` returned a bag of already-resolved values.
That is push style, one combined resolver, and hard to type sibling projection.
Per-getter named exports would split one entry contract across the module surface and force ugly per-property typing helpers.

The v1 contract is one default-exported object of optional getters (pull), wrapped in `defineServerEntry` / `defineClientEntry` so TypeScript can infer types from getter returns and apply them to later sibling args (`NoInfer` on input positions, same idea as inferring within a generic function).

Shared libraries contribute properties apps spread into the object:

```ts
export default defineServerEntry({
  ...seekHostResolvers, // { getSite, getLanguage }
  getClientContext({ req }) {
    /* … */
  },
});
```

Sku holds **no** opinion about where values live on `req`.
There is no conventional key and no default getter reading one.

Accepted cost: site and language often derive from one parse, so two getters can parse twice.
Libraries can memoise on `req`.
A single combined **value** resolver was rejected because it reintroduces the `onRequest` return-bag shape.

Getters are **sync-only** and SHOULD stay pure/simple.
Docs recommend that.
Optional `getRouterContext` MAY still be async because it seeds loader context next to `query`.

**Call order (all before `query()`):**
`getSite` (or sole resolved site) → `getLanguage` → `getClientContext` → `getReactContext` → optional server `getRouterContext` → `query()`.
Later getters receive already-resolved sibling values (`site`, `clientContext`, `reactContext`) so apps project instead of re-deriving.
`getClientContext` runs before render so its value reaches the hydrate bootstrap and `SkuProvider`.
Keep the existing docs warning that `clientContext` is serialised after shell-ready into the bootstrap script.

Tree: `Document` → always-on `SkuProvider` → router (pre-built tree for `site`) → that site’s routes, whose root layout route is app-owned.
`site` from `getSite` (or the sole resolved site) selects the pre-built handler/tree and is serialized into the hydrate bootstrap for the client router.
It is **not** an `onHydrate` argument.

`language` from `getLanguage` is server-local for Document vocab preload only (not Async Local Storage, not `onHydrate`, not a React hook in v1).
Its return type is still inferred as `L` on the server entry object for typed entry surfaces.
It does not reach `SkuProvider` or `createSkuContexts`.

`clientContext` from `getClientContext` reaches the hydrate bootstrap and `useClientContext` (same value on both sides).
Omitted / `undefined` MUST serialise as JS `undefined` in the bootstrap (not JSON `null`).
An explicit `null` return stays `null`.

`reactContext` from dual-entry `getReactContext` reaches `useReactContext` and MAY differ per environment (not serialised).

Omit `middleware` ⇒ no consumer middleware layer.
Omit `onListen` ⇒ no post-listen callback (see Decision 25).
Omit `onHydrate` ⇒ no hydrate side effects.

### 12a. Always-on SkuProvider, three value channels, root layout for wrapping

Two wrapping concerns were previously conflated into one sku-owned `AppWrapper` / app `Providers` mount:

1. **Router-aware, isomorphic wrapping**. Needs `useLocation` / loader data (e.g. `VocabProvider` keyed on pathname, mounting Apollo around the outlet, page chrome).
2. **Environment-scoped dependency values**. Server and client need _different_ modules or constructions (API clients, `makeClient`, client-only `window` SDKs). `routesEntry` is one shared module, so it cannot express the construction, only the consumption.

**Pass-through `Providers` was the wrong seam.**
Fixtures showed apps reinventing React context solely to pipe `site` / `clientContext` that sku already owned, while the rare env-differing case (Apollo `makeClient`) still needed a dual-entry component.
Sku now owns the isomorphic React bag, env-differing **values** come from dual-entry getters, and isomorphic **wrapping** lives in the root layout.

**Three channels.**
Docs MUST diagram this.
Prefer a Markdown table or nested list.
VitePress has no built-in Mermaid, and the site does not ship a Mermaid plugin today.

| Channel                      | Entry export       | React / RR consumer        | Same on server & client?           | Serialised?             |
| ---------------------------- | ------------------ | -------------------------- | ---------------------------------- | ----------------------- |
| Wire / isomorphic React seed | `getClientContext` | `useClientContext()`       | Yes (by construction)              | Yes → hydrate bootstrap |
| Env-differing React values   | `getReactContext`  | `useReactContext()`        | **May differ**                     | No                      |
| Loader / action context      | `getRouterContext` | `context.get()` in loaders | Same keys; construction may differ | No                      |

```
Document
  └── SkuProvider   ← always (site, clientContext, reactContext)
        └── Router
              └── root layout route   ← Vocab, Apollo wrap, chrome
                    └── pages
```

**Split accordingly:**

- **Concern 1 → the app’s own root layout route in `routesEntry`.** Plain React Router + sku hooks. Route hooks, loader data, and Suspense all work normally, and it is isomorphic by construction. Prefer a pathless layout route over `path: '/'`. Matching is identical (relative children join against `/` either way), it reads as a layout rather than a URL, and it keeps wrapping any root-level sibling added later. Env-specific providers that need a component wrapper (e.g. Apollo’s `WrapApolloProvider` with `makeClient`) mount here and read `useReactContext()`. They do not need a dual-entry component export.
- **Concern 2 → optional dual-entry `getReactContext`.** Server and client MAY return different bags (`makeClient`, `apiClient`, `extraScriptProps`, window SDK handles). Sku puts the result on `SkuProvider`, and the isomorphic tree consumes it via hooks.

**Consequences:**

- Sku never wraps the **route tree**. There is no pathless sku wrapper route, no sku-owned route id, and no hydration-shape alignment concern.
- `createStaticHandler` per site at init falls out for free. Nothing on the request path can touch the tree.
- No app-authored `Providers` export. An optional compose slot above the router is deferred until a real need appears that root-layout + `getReactContext` cannot cover.
- No `Providers` markup probe / identical-DOM warning. Sku’s provider is context-only by construction, and app wrappers in the root layout are isomorphic.
- Request-scoped values need no smuggling channel: no consumer-authored Async Local Storage, no module-level `let` set by `onHydrate`.

**Typing: `define*Entry` inference + `createSkuContexts<typeof server, typeof client>`.**

Bare `export default { … }` has no generic inference scope, so sibling methods cannot see each other’s return types.
`defineServerEntry` / `defineClientEntry` are zero-runtime identity helpers that create that scope: infer returns, apply them to later sibling args via `NoInfer` on input positions.

`defineServerEntry` infers `Site` / `Language` / `ClientContext` / `ReactContext` from `getSite` / `getLanguage` / `getClientContext` / `getReactContext`.
Server later getters receive `site: NoInfer<Site>`.

`defineClientEntry<ServerEntry>` extracts `Site` / `ClientContext` from that server entry (`string` / `undefined` when the corresponding getter is omitted) and infers `ReactContext` from client `getReactContext`.
Client sibling `site` / `clientContext` args use those extracted types.
The hydrate bootstrap carries the same values the server produced.
Reuse the same extractors as `createSkuContexts` (do not invent a second `ClientContextOf` shape).

`defineClientEntry` cannot infer `ClientContext` from the client object alone.
Those values only appear as callback inputs (`onHydrate` / `getReactContext` / `getRouterContext`), so TypeScript has nothing to infer from and falls back to `undefined`.
Apps pass `defineClientEntry<typeof server>()({ … })` curried.
TypeScript cannot partially infer type parameters when `ServerEntry` is explicit.
Omit the type argument and call `defineClientEntry({ … })` directly ⇒ `ClientContext` is `undefined` and `site` stays `string`.

The helpers are identity functions at runtime.
Annotating app getters with the loose public aliases (`SkuGetSite` / `SkuGetLanguage` / …) widens returns to `string` and defeats literal inference.
Prefer letting `defineServerEntry` infer, or narrow inside the getter body.

Sku still exports `SkuServerEntry` / `SkuClientEntry` as the structural types behind those helpers (and for advanced `satisfies` use).
Apps are not required to declare `ClientContext` / `ReactContext` / site aliases up front.

```ts
// server.tsx
import { defineServerEntry, getCspNonce } from 'sku/runtime';

const server = defineServerEntry({
  getSite({ req }) {
    // Narrow here — do not annotate as SkuGetSite (widens to string)
    return req.site === 'nz' ? 'nz' : 'au';
  },
  getLanguage({ req }) {
    return req.language === 'fr' ? 'fr' : 'en';
  },
  getClientContext({ req }) {
    return { fromServer: true, userId: req.skuUserId ?? null };
  },
  getReactContext({ site, clientContext }) {
    // site inferred as 'au' | 'nz'; clientContext from getClientContext
    return {
      makeClient: serverMakeClient,
      extraScriptProps: { nonce: getCspNonce() },
    };
  },
  getRouterContext({ clientContext, reactContext }) {
    // reactContext inferred from getReactContext return
    const ctx = new RouterContextProvider();
    ctx.set(userIdContext, clientContext?.userId ?? null);
    if (reactContext) ctx.set(apiClientContext, reactContext.makeClient());
    return ctx;
  },
});
export default server;

// client.tsx — type-only import of server; no runtime cycle
import type server from './server';
import { defineClientEntry } from 'sku/runtime';

const client = defineClientEntry<typeof server>()({
  onHydrate({ clientContext }) {
    // clientContext typed from server getClientContext
  },
  getReactContext({ site, clientContext }) {
    // site: 'au' | 'nz'; clientContext from server
    return { makeClient: clientMakeClient };
  },
});
export default client;

// ssrContext.ts — type-only imports; no runtime cycle with entries
import type server from './server';
import type client from './client';
import { createSkuContexts } from 'sku/runtime';

export const { useSite, useClientContext, useReactContext } = createSkuContexts<
  typeof server,
  typeof client
>();
```

`createSkuContexts` is a typed facade over one well-known React context module that sku’s render also uses.
Shared identity for that module (and the same class of problem for `useInsertHtml` / preload registry / CSP nonce storage) is Decision 26.
Prefer one public specifier `sku/runtime` for app and sku runtime, keep `unbundle: true` for separate dist modules, and `optimizeDeps.exclude` so Vite does not clone published packages.

It extracts:

- `Site` from the server entry’s `getSite` return (or `string` if `getSite` is omitted on a 0–1 site app / sole resolved name).
- `ClientContext` from the server entry’s `getClientContext` return (or `undefined` if omitted).
- `ReactContext` from both entries’ `getReactContext` returns as a union. Server may include fields the client omits (e.g. `extraScriptProps`).

`useSite()` returns that `Site` union.
No consumer cast is required.
Language is not extracted into a React hook (see Non-Goals / Deferred).
Hand-written `ClientContext` / `ReactContext` / site aliases remain optional style when an app prefers them.
They are not required.

Rejected alternatives:

- Module augmentation alone (easy to drift from the entry object).
- Per-property `defineGet*` helpers (ugly; one entry object is enough).
- Requiring apps to declare context interfaces before writing getters.
- Per-getter named exports (splits one contract; worse typing ergonomics).
- Declaring `sites` on the server entry object or importing `sku.config` into the React graph for typing. Duplicates config and creates a layering smell. Apps narrow in `getSite` instead.
- Expecting `defineClientEntry` to infer `ClientContext` from client callback parameters alone. Inputs are not inference sources. Pass `typeof server`.
- Hand-rolling a `ClientContext` type alias solely for `defineClientEntry<ClientContext>` when `typeof server` already carries it (optional style only; not required).
- Generic `SkuRouteObject<S>` for route membership in this pass (follow-on).

React Router `createContext` keys for loaders remain a separate typing layer (RR already types `context.get(key)`).
They are not fields extracted from the entry objects.

**Getters and sibling projection:**

- `getSite` / `getLanguage` / `getClientContext` receive `{ req }` only (Express after consumer middleware). Do not pass Fetch `Request` or `res`.
- Server `getReactContext` receives `{ req, site, clientContext }`.
- Client `getReactContext` receives `{ site, clientContext }` from the hydrate bootstrap (no Express).
- Server `getRouterContext` receives `{ request, req, site, clientContext, reactContext }`.
- Client `getRouterContext` receives `{ site, clientContext, reactContext }`. Sku wraps RR’s zero-arg `getContext` to pass those args.
- Typical projection: put serialisable seeds in `clientContext`, put `apiClient` / `makeClient` in `reactContext`, and have `getRouterContext` do `ctx.set(userId, clientContext.userId)` rather than re-reading `req`.

**Typing middleware-attached fields on `req`:**
Product docs MUST show Express `Request` augmentation (same approach as `getCspNonce`), shared by `middleware`, getters, and server `getRouterContext`.

**Optional dual-entry `getRouterContext`:**
Same typed keys (`createContext` + `RouterContextProvider`), different construction per environment when needed.
Omit either property ⇒ empty/default context behaviour.

The three channels cannot collapse into one.
React Router 8 exposes no public hook for reading `RouterContextProvider` from components, and serialisable wire state must not be forced to carry non-JSON clients.
Docs MUST state which channel to use for which consumer.

Do **not** teach consumer-authored Async Local Storage, module-level mutable state, or “return a wrapper component from a request-entry export” as the way to pass request-scoped values into React.

`clientContext` and `reactContext` are page-load seeds and do not change across client navigations.
Values that must track navigation belong in the root layout (concern 1).

### 13. Request-scoped nonce (lazy, single value)

At most one CSP nonce per render, minted only when requested.
Async Local Storage holds **CSP nonce only**.

### 14. Vocab / language chunks

When `languages` is set, `@vocab/vite` handles splitting at build time.

**Resolve ownership:**
`@vocab/vite` is a sku dependency.
Consumers MUST NOT need a direct `@vocab/vite` dep for resolve to succeed.

When the vocab plugin or `languages` is active, sku’s shared Vite config (`packages/sku/src/services/vite/plugins/config.ts`) MUST:

1. Resolve `@vocab/vite` from **sku’s** install tree (`createRequire(import.meta.url)`), not the app’s `node_modules`.
2. Pin bare imports onto that copy via `resolve.alias`:
   - `@vocab/vite/runtime` → absolute file from `require.resolve('@vocab/vite/runtime')`. Prefer the export file, not only the package name (more reliable under Rolldown/Vite).
   - Do not alias the `@vocab/vite` package root. That breaks subpath imports such as `@vocab/vite/chunks` (sku’s own SSR render imports it).
3. Apply aliases in the shared Vite config (covers both client and SSR builds today).

That forces injected imports (including ones `@vocab/vite` injects into `.vocab` files) onto sku’s copy — one instance, aligned with the plugin sku loaded.

**Shared packages:**
The alias is project-wide.
It also covers bare `@vocab/vite/runtime` from shared React packages (e.g. Header/Footer with `.vocab`) when those modules are in the Vite graph — the usual sku path via `compilePackages` (SSR `noExternal`).
Vocab’s compile ignore already skips only `node_modules/sku/**` and `node_modules/vocab/**`, so dependency `.vocab` folders remain discoverable.
Sku separately compiles configured `compilePackages` roots because Vocab’s own compile ignores `node_modules`.

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

- `__SKU_DEFAULT_SERVER_PORT__` — default listen port from config `port` (same value as `sku start`). Keep the webpack-aligned define name. Do not introduce a second SSR port knob. `process.env.PORT` still wins at runtime. Providing `serverPort` with SSR MUST error.
- `__SKU_PUBLIC_PATH__` — static asset prefix from config `publicPath` (webpack SSR parity). Do not use Vite’s `import.meta.env.BASE_URL` in sku runtime code.
- `__SKU_CSP__` — single object aligned with webpack’s `{ enabled, extraHosts }`, extended for Vite Report-Only fields (e.g. `reportOnlyEnabled`, `reportOnlyExtraHosts`, `reportOnlyReportTo`).

Dev continues to pass these from live `skuContext` (no defines required on the start path).

### 16. Lazy-route `moduleId` (SSR preload source)

Auto-derive `moduleId` for idiomatic `lazy: () => import('…')`.
Never overwrite explicit values.
Skip non-idiomatic factories.
Warn in dev on miss.

SSR Document CSS and `modulepreload` links come **only** from matched-route `handle.moduleId` values (plus optional vocab language chunks) resolved against the Vite client manifest.

`@sku-lib/vite/loadable` remains the static / prerender code-splitting and preload API (`createPreRenderedHtml` + Collector / `LoadableProvider` + `preloadPlugin` third-arg `moduleId` injection).
SSR does **not** wire that collector into the streamed Document.

Rationale: React Router Data Mode already owns route-level splitting via `lazy`.
A second loadable-based preload channel would duplicate the API, leave Document assets out of sync with “I used loadable,” and complicate Migrating from webpack SSR (which already requires a route-model rewrite).

Nested component splits inside a route are not first-class Document preloads in v1.
Consumers can still use client-side lazy loading without sku injecting those chunks into the initial HTML.

### 17. Intent module preload (`usePreloadRoute`)

Document `modulepreload` covers the _matched_ route.
Warming the _next_ route’s lazy chunks on hover / focus / touch is a separate concern — Data Mode has no `<Link prefetch>` (Framework Mode only).

Sku owns it, because sku already owns the tree the warm-up must match against.
The client entry selects the site tree with `selectForSite` before creating the router, and registers it on a shared module.
Module identity for that registry (same class as `getCspNonce` / `SkuProvider` / `useInsertHtml`) is Decision 26: consolidate sku runtime onto `sku/runtime`, keep `unbundle: true` so dist keeps one physical module per shared file, and `optimizeDeps.exclude` so Vite does not clone published `sku` / `sku/runtime`.

The hook lives on its own subpath so the main `sku` entry never pulls in the optional `react-router` peer for webpack / static consumers:

```tsx
import { usePreloadRoute } from 'sku/runtime';

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
Calling `lazy()` is enough — the module cache serves the navigation’s later call.
No route-tree mutation.

Outside SSR, and during server render, no tree is registered and the returned function is a silent no-op.
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

Template `ssr` MAY omit config `sites` (sku soft-defaults to `'default'`), with `expressTrustProxy: true` in `sku.config` (visible Melways/SEEK-shaped trust proxy — see Decision 25), a `routesEntry` + flat `routes` scaffold (optional route-level `sites` only when membership differs), and `defineServerEntry` / `defineClientEntry` + `createSkuContexts<typeof …>` + optional `getClientContext` / `getReactContext` / `onHydrate` properties.
The template omits `getSite` (sku uses the sole resolved site name).
Multi-site examples declare ≥2 config sites and include `getSite` on the server entry object.
Request entries do not re-export `routes`.

The template’s `routesEntry` scaffolds an app-owned pathless root layout (`src/RootLayout.tsx`) so router-aware wrapping (and Apollo-style provider mounts) have an idiomatic home.
Typed hooks live in `src/ssrContext.ts`.
The home page calls `useSite()` (soft-default `'default'` when config `sites` is omitted).
There is no `src/App/` shell — page content lives under `src/pages/`.

Lazy page modules MUST use React Router Data Mode named `export function Component` (not `export default`) so they typecheck with `lazy: () => import('…')`.

Migrating docs cover Static App and Older / Webpack SSR App, not under `docs/migration-guides/`.

Migrating MUST cover:

- Named `Component` on lazy pages.
- `routesEntry` + flat `routes` + optional `sites` + `getSite` (required when config has >1 site; fail closed on unknown / non-string site; sole resolved site — soft-default `'default'` when config `sites` is empty — when omitted on 0–1 site).
- Multi-site membership via `sites` on routes (optional language path params, union tree + allowlist, or sku host matching as the product story).
- Webpack dual-port → SSR single `port` (reject `serverPort`; `PORT` still overrides prod).
- `dist/server/server.js` + sibling build `client/` / `server/`.
- Baked server-local Vite client manifest (no sibling `client/` required to start).
- Recommended production: host hashed assets via reverse proxy / persistent storage; ship `server/` with runtime `node_modules`.
- Standalone Node `express.static` of sibling `client/` as experimentation / edge case only.
- CJS interop for `sku start`.
- Express 4 typing (shared sku major; no Express 5 in this change).
- React Router 8 as optional peerDependency `^8` for Data Mode / route typing (SSR template/fixtures install it).
- Moving off config `public` / public assets folder (import assets instead).
- `dangerouslySetViteConfig` and `vitePlugins` unsupported for SSR (hard-error; raise use-cases via sku-support).
- Server-only loaders vs client route graph (+ explicit `moduleId` when needed).
- Prefer render-time data loading with clients from `useReactContext` / `useClientContext`. Reach for loaders on waterfalls, document redirects, headers, or opt-in `getRouterContext`.
- Apollo apps replace two-pass `getDataFromTree` with a streaming transport over `useInsertHtml`. Dual-entry `getReactContext` supplies `makeClient` / server `extraScriptProps`. The isomorphic Apollo provider mounts in the root layout via `useReactContext()`.
- The three value channels (`getClientContext` / `getReactContext` / `getRouterContext`) plus always-on `SkuProvider` + `createSkuContexts<typeof server, typeof client>()`, vs router-aware wrapping in the app’s own root layout route.
- Optional dual-entry `getRouterContext` patterns (Data Mode vs Framework Mode). Red warning against putting Express `req` in `RouterContextProvider`.
- Express `Request` module augmentation for middleware-appended fields (`express-serve-static-core`, shared by `middleware` / getters / server `getRouterContext`).
- Default-exported request-entry objects via `defineServerEntry` / `defineClientEntry` replacing `onRequest`. Optional `middleware` / `onListen` / `onHydrate` properties.
- Webpack `onStart` → server-entry `onListen({ app, httpServer, port })` (bound `port`, plus `httpServer` for keep-alive timeouts). Trust proxy via config `expressTrustProxy`, not `onStart`.
- Braid reset-before-Braid on `sku start` (Braid apps; no sku auto-inject).
- Client-only / `window`-touching libraries via client `getReactContext` (omit or return stubs on server) + root-layout / `useEffect` consumers — not a dual-entry component export.
- Jest → Vitest prerequisite (link existing docs / codemod).
- `#` `pathAliases` / `migrate-root-resolution` for bare `src/…`.
- Sku-owned `@vocab/vite` resolve (no consumer pin for `@vocab/vite/runtime`).

#### Server-only loaders vs client route graph

Because `routesEntry` is imported into both graphs, dynamic imports inside it (e.g. `import('./loadHomeData')`) can pull server-only modules into the client build.
Keep server-only loader modules off the client-imported graph (e.g. separate `*.server.ts` pages, or avoid attaching those loaders on the shared tree).
When the lazy factory is no longer a bare `() => import('./home')`, set `handle.moduleId` explicitly so modulepreload still works.

Do **not** ship an automatic `*.server.ts` client strip in this change — convention + docs only.
Prefer not to rely on server-only loaders for page content — see data-loading guidance below.
With Express `req` on getters / `getRouterContext`, prefer projecting isomorphic values rather than env-split route trees.

#### Braid reset evaluation order (`sku start`)

On `sku start`, Vite’s SSR module graph can evaluate a loader → page → Braid before `App.tsx`’s `import 'braid-design-system/reset'`, throwing “Braid components imported before reset.”
Production build may succeed with a different order.

Apps that use Braid must ensure reset runs before any Braid-touching server module (e.g. top of `serverEntry` and any early-imported loader that pulls Braid).
Do **not** auto-inject Braid reset into sku’s SSR server entry — Braid is optional per app.

#### Client-only / window-touching libraries during Document SSR

Values that construct against `window` (e.g. analytics SDKs) throw during full-document SSR.
Webpack SSR often only mounted those on `#app` client hydrate.

Put construction in **client** `getReactContext` (server returns `undefined` / omits the field).
Consume from the root layout or a small client-only wrapper (`useEffect` mount) via `useReactContext()`.
Do **not** reintroduce a dual-entry component export for this in v1.

#### Jest → Vitest prerequisite

SSR apps are expected to use `testRunner: 'vitest'`.
Migrating MUST call this out as a prerequisite and point at existing Vitest docs / `@sku-lib/codemod jest-to-vitest` / checklist (mock shapes, RTL, platform singletons).
No new Jest → Vitest codemod in this change.

#### Path aliases: bare `src/…` → `#src/…`

Webpack `baseUrl: '.'` allowed `import 'src/…'`.
SSR `pathAliases` require `#` subpath imports.
Migrating MUST point at `pathAliases` + the existing `migrate-root-resolution` codemod / changelog guidance.

### 21. Data loading guidance (docs-led)

Prefer **render-time** data loading in React for page content:

- Inject an env-specific API / Experience / Apollo client via dual-entry `getReactContext` and read it with `useReactContext()` (serialisable seeds via `getClientContext` / `useClientContext`; `site` via `useSite()` — not a component returned from a getter, not consumer-authored Async Local Storage).
- Fetch in the React tree with Suspense (e.g. `useQuery`) so the same components work on SSR and client navigations.
- When the client has a cache that must survive the stream (Apollo), pair it with a streaming transport over `useInsertHtml` — see Decision 21a.

Rationale: portable shared UI without per-app loader wiring, aligned with streaming Document and isomorphic backends.

Reach for React Router **loaders** when you need to:

- Start work before the suspending subtree renders (waterfall / parallelisation).
- Issue a real **document** `redirect()` / response headers (`Cache-Control`, `Set-Cookie`, …).
- Use advanced loader/action context via optional dual-entry `getRouterContext` (same `createContext` keys on both sides; project from `clientContext` / `reactContext` when possible).

`<Navigate />` on static initial render is a no-op — it is not a document HTTP redirect.
Loaders receive a Fetch `Request`, not Express `req`.
Sku does **not** make Express `req` the loader `request` argument.

#### Data Mode vs Framework Mode `getLoadContext`

Sku is **Data Mode**, not Framework Mode:

|                    | Framework Mode                     | Sku Data Mode                                                                    |
| ------------------ | ---------------------------------- | -------------------------------------------------------------------------------- |
| Server seed        | Adapter `getLoadContext(req, res)` | Entry `getRouterContext({ request, req })` into `query(..., { requestContext })` |
| Client nav loaders | Often still server (`.data`)       | Browser via `createBrowserRouter`                                                |
| Client seed        | Needed for client-only paths       | Needed for **every** client nav if loader context is used                        |

Copying only Framework’s server-half adapter into sku leaves client-nav loaders without context.
If loader context is offered at all, prefer dual entry.

Document clearly:

- Server seeds from Express middleware bag + Fetch `request`; client seeds from browser-visible state (`clientContext`, `reactContext`, cookies, memory, etc.).
- Cadence: server once per document `query`; client every nav/fetcher.
- Relation to Express `middleware` vs RR route `middleware` vs entry `getRouterContext`.
- Relation of the three value channels (`getClientContext` / `getReactContext` / `getRouterContext`) vs the app’s root layout route (router-aware wrapping + isomorphic provider mounts) — they compose. Getters / optional `onHydrate` are for values and hydrate side effects, not for returning wrappers.

**Red warning (MUST ship in product docs):**
Never put Express `req` (or other non-isomorphic platform objects) into `RouterContextProvider`.
Project **values** / isomorphic-capable dependencies that both server and client `getRouterContext` can supply.
Raw `req` is `undefined` on client navs and becomes a landmine.

**Required docs example:**
Client `getRouterContext` (or a loader using context) loading data for a **different location than the initial SSR location** — after client navigation — showing the client seed must work without Express and must not assume document-SSR-only state (e.g. user/logger from `req` on server, re-derived on client, navigate, loader still gets context).

Product + Migrating docs MUST encode this hierarchy and rebalance any wording that implied loaders are the default for content.

### 21a. Streaming data transports: `useInsertHtml`

Render-time data loading (Decision 21) is only credible if a real client cache can survive the stream.
Apollo Client is the case that matters for sku consumers, and its streaming hydration is a critical adoption requirement: queries that ran during SSR must populate the browser cache instead of refetching, while queries issued after hydration still fetch normally.

Every streaming transport works the same way — serialize query events during SSR and inject them as `<script>` chunks **between** React’s stream chunks, so they execute before hydration.
`@apollo/client-react-streaming`’s `buildManualDataTransport` therefore requires one thing from the framework: `useInsertHtml(): (callback: () => ReactNode) => void`.
Next.js satisfies it with `ServerInsertedHTMLContext`.
Apollo’s own Vite example satisfies it by having the server harness create a transform stream and pass `injectIntoStream` down through app-owned context.

Sku owns `renderToPipeableStream` and the response pipe, so an app cannot reach the stream at all.
This is the same argument that justifies sku-owned request-scoped values (Decision 12a): sku owns the render call, so the seam has to be sku’s.

**Sku owns** a render-scoped injection queue, a React context carrying `insertHtml`, flushing queued nodes into the byte stream at chunk boundaries, the `useInsertHtml` hook, and always-on `SkuProvider` for `site` / `clientContext` / `reactContext`.
**Apps own** the transport and the client (`WrapApolloProvider(buildManualDataTransport({ useInsertHtml }))`), with dual-entry `getReactContext` supplying `makeClient` (and server `extraScriptProps`), mounted isomorphically in the **root layout** via `useReactContext()`.

Sku ships no Apollo dependency, provider, or config.
The seam is transport-agnostic.

```tsx
// app-owned transport — shared isomorphic module
import { useInsertHtml } from 'sku/runtime';
import { WrapApolloProvider } from '@apollo/client-react-streaming';
import { buildManualDataTransport } from '@apollo/client-react-streaming/manual-transport';

export const ApolloProvider = WrapApolloProvider(
  buildManualDataTransport({ useInsertHtml }),
);

// root layout — isomorphic; values differ because getReactContext differed
const { makeClient, extraScriptProps } = useReactContext();
return (
  <ApolloProvider makeClient={makeClient} extraScriptProps={extraScriptProps}>
    <Outlet />
  </ApolloProvider>
);
```

Do not share one `makeClient` with `typeof window` — that is what separate entry `getReactContext` exports are for.

`useInsertHtml` lives on `sku/runtime` next to `usePreloadRoute` and `createSkuContexts`.
The app’s transport module is imported by **both** graphs, so the export must be browser-safe, and the main `sku` entry must stay free of the optional `react-router` peer.
Module identity (sku `render` + consumer `sku/runtime` → one insert-html context instance) is Decision 26 — the same dual fix as `getCspNonce` and the preload registry.

**Contract:**

- During document SSR, the returned function queues `() => ReactNode` for the current render.
- Sku renders queued nodes to static markup and writes them into the response **before the next React chunk**, and flushes any remainder at stream end. Injection therefore lands after the shell but before hydration runs.
- Anywhere there is no sku SSR render around it — including the client graph — it is a silent no-op. It MUST NOT throw. Apollo’s Next.js implementation throws on a missing context; sku’s must not.
- Under `handle.waitForAll`, injection still happens; the whole document is buffered to `onAllReady` and written in order.

**CSP:**
Injected script bodies are not known when headers are derived from the shell, so they cannot be hashed — they MUST carry the nonce.
`buildManualDataTransport` supports this through the wrapped provider’s `extraScriptProps`, and `render` already mints a nonce before `pipe`, so `'nonce-…'` is in `script-src` for every SSR document.
Server `getReactContext` returns `extraScriptProps={{ nonce: getCspNonce() }}`; the client omits it.
Server-only `getCspNonce` stays on the main `sku` entry — only the transport module is shared.

**Hydration ordering is already safe.**
Injected scripts arrive after sku’s `bootstrapModules` tag in document order, but module scripts are deferred and the transport’s late-initializing queue starts life as a plain array (`window[…].push` before the reader exists), so nothing is dropped.

**Why not `@apollo/client-integration-react-router`:**
It is alpha, peers `react-router@^7` (sku is on 8), and its `apolloLoader` / `preloadQuery` path returns transported query refs that carry a promise chain (`promiscade`) through loader data.
Sku serializes loader data as JSON and promise-scrubs it (Decision 19), so those refs cannot survive hydration without streaming (turbo-stream) loader data — a much larger change, and one that would pull sku toward Framework Mode.
Its `ApolloHydrationHelper` needs only `useMatches`, so it would work in Data Mode, but it exists to revive loader-transported refs and is unnecessary on the render-time path.
Render-time `useSuspenseQuery` under the app’s root-layout provider is the supported path, which is where Decision 21 already points.

**Why not depend on Apollo’s `stream-utils`:**
`createInjectionTransformStream` is a Web `TransformStream` built for `renderToReadableStream`, and sku uses `renderToPipeableStream` with Node streams.
Sku implements the equivalent Node transform itself and stays transport-agnostic.

**Rejected alternatives:**

| Approach                                      | Why not                                                                                                                 |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| App dual-entry `Providers` for Apollo         | Pass-through ceremony for values sku already owns; env-specific values belong in `getReactContext`, wrap in root layout |
| `insertHtml` as a server-only React prop      | Every app re-creates the same context to reach a module-scope `buildManualDataTransport`; unavailable to route code     |
| Async Local Storage instead of React context  | Decision 13 keeps ALS to the nonce; resumed suspended work is not reliably inside the render’s ALS scope                |
| Sku owning an Apollo provider / config option | Sku would own a client lifecycle, link chain, and cache config it cannot version independently                          |
| Sku auto-adding the nonce to injected scripts | Sku does not render those nodes’ props; `extraScriptProps` is already the transport’s supported channel                 |
| Two-pass `getDataFromTree`                    | Incompatible with streaming; the pattern SSR exists to replace                                                          |

### 22. Experimental first release

Docs warning + changeset: available for testing, not for production.
No runtime experimental gate.

### 23. CJS default-export interop (docs only)

Keep existing `vite-plugin-cjs-interop` + `__UNSAFE_EXPERIMENTAL__cjsInteropDependencies` and Apollo-only baked defaults.
Do **not** expand sku’s default interop list for this change.

Document the start-vs-build failure mode (“Element type is invalid … got: object”) and how to extend the config list, with common open-source offender examples.
Do **not** rewrite or wrap React render errors at runtime — docs are enough.

### 24. Express 4 (shared) + React Router 8 (optional peer)

SSR mounts consumer middleware into sku’s **shared** Express app — the same `express` / `@types/express` dependency webpack SSR and `sku serve` use.
This change keeps that major on Express 4.
It does **not** upgrade Express 4 → 5.

A single Express major cannot be Express 5 for SSR and Express 4 for webpack SSR without splitting the package.
Upgrading would be a breaking change for webpack SSR middleware / `onStart` / `devServerMiddleware` and related typings.
Static Vite is unaffected (Connect), but webpack SSR is in the blast radius.

SSR targets React Router 8 via an optional peerDependency `react-router: ^8` (not a hard sku dependency).
RR is SSR-scoped and is not shared the way Express is.
The SSR template and fixtures install React Router 8.
Webpack / static apps do not need it and MUST NOT be forced onto RR8 by this change (do not bump webpack fixtures solely to RR8).

Sku MUST NOT ship Jest transforms for `react-router` / `cookie-es` / `import.meta` in this change.
SSR requires Vitest.
React Router 8 + Jest for webpack consumers is out of scope.

Document Express 4 for middleware typing (`middleware` / `SkuMiddleware`) and React Router 8 for Data Mode / route typing consumers rely on.
Document Express `Request` module augmentation (`express-serve-static-core`) so middleware-appended fields type-check in `middleware`, the getters, and server `getRouterContext` — same pattern as sku’s `getCspNonce` augmentation.

Align any React Router 8 peer baselines sku already owns (Node / React / Vite) where the catalog or engines need a bump.
Do not expand sku’s supported React range solely for packages that still support React 18 unless required by the upgrade.

Sku owns the Express app that mounts consumer middleware and the React Router Data Mode wiring for SSR.
Those packages are not opaque transitive deps — their majors are part of the SSR product contract (Express via the shared sku server; React Router via Data Mode peer + consumer install).
Keep majors pinned in docs and release notes, and call out major bumps in changesets as potentially breaking for SSR consumers.

**Breaking-change policy (later releases):**
Bumping the Express or React Router major that SSR integrates may be a breaking change.
Consumer `middleware` / `devServerMiddleware` mount into sku’s Express app, and consumer routes/entries use React Router Data Mode APIs (`routes` + optional `sites`, `lazy` + named `Component`, loaders/actions, etc.).
Minor/patch upgrades within the documented major remain non-breaking when APIs stay compatible.

**Deferred:**
Express 5 as a separate sku-wide breaking change (webpack SSR + SSR + `sku serve` together).
Jest support for React Router 8 (if ever needed for webpack) is a separate concern.

### 25. Server-entry `onListen` + config `expressTrustProxy`

Webpack SSR’s `onStart({ app })` was the post-listen hook for server setup (logging, timeouts, Express knobs).
Migration spikes (CBS was the only app still on webpack `onStart`) showed the real gaps were:

1. Express `trust proxy` behind Melways / reverse proxies.
2. `httpServer.keepAliveTimeout` (webpack only passed `app`, so timeouts never applied).
3. Readiness logging with the **bound** port.

**`onListen` (server entry):**

```ts
onListen?: (args: {
  app: Express;
  httpServer: http.Server | https.Server;
  port: number;
}) => void | Promise<void>;
```

Sku calls `onListen` once after middleware + HTML pipeline are mounted **and** `listen` has succeeded — the same window as webpack `onStart`, in both `sku start` and production.

- Await the callback if it returns a promise. Failure MUST fail startup.
- Call **once** (not on every server-entry HMR reload in start).
- Do **not** add `onBeforeListen` — process-wide setup before bind stays at module top-level.
- Do **not** add sku-owned listen logging by default — apps log in `onListen` if they want.

Wire the call from shared production `listen` and `createDevSsrServer` (start).

**`expressTrustProxy` (sku config):**

- Type: optional boolean named `expressTrustProxy` (SSR).
- When `true`, sku sets `app.set('trust proxy', 1)` (hop count **`1`**, despite the boolean name — safer single-hop than Express boolean `true`).
- When omitted / `false`: leave Express default (`false`). Not magically on.
- Not a silent sku default — opt-in via config.
- Create template MUST set `expressTrustProxy: true` so new apps get SEEK/Melways-shaped behaviour visibly in config.
- Any other trust-proxy value (`false`, `2`, IP list, …) → override in `onListen` via `app.set('trust proxy', …)`.

Rejected alternatives:

| Approach                                  | Why not                                                                                  |
| ----------------------------------------- | ---------------------------------------------------------------------------------------- |
| Invisible sku default for `trust proxy`   | Hides Melways behaviour; hard to discover; rejected in favour of named config + template |
| Express `app.set('trust proxy', true)`    | Boolean `true` trusts all hops; hop count `1` is the common SEEK case                    |
| `onBeforeListen` hook                     | Module top-level already covers process-wide setup before bind                           |
| Sku-owned listen logging                  | Apps own logging; `onListen` + bound `port` is enough                                    |
| Pass only `app` (webpack `onStart` shape) | Blocks `httpServer.keepAliveTimeout`; migrants need the server handle                    |

Example:

```ts
// sku.config.ts
export default {
  bundler: 'vite',
  buildType: 'ssr',
  expressTrustProxy: true, // → app.set('trust proxy', 1)
} satisfies SkuConfig;

// server entry
defineServerEntry({
  onListen({ app, httpServer, port }) {
    httpServer.keepAliveTimeout = 20_000;
    logger.info({ port }, 'App has started');
    // rare: app.set('trust proxy', 2) or false
  },
  // …middleware / getters
});
```

Docs: `entries.md` (`onListen`), `configuration.md` (`expressTrustProxy` → sets hop count `1`), migrate-from-webpack (`onStart` → `onListen` bag; trust proxy via config not `onStart`).

### 26. Shared SSR module identity: consolidate onto `sku/runtime` + `optimizeDeps.exclude`

Published / tarball installs put `sku/runtime` into `.vite/deps` (e.g. `sku_runtime.js`).
App code then gets Context A from that prebundle, while sku’s `SkuProvider` (via relative imports in the SSR client / render entries) uses Context B from the unbundled context module.
Hooks throw “must be used within SkuProvider.”

```
App createSkuContexts()  →  .vite/deps/sku_runtime.js Context A
SkuProvider in render/client  →  unbundled context module Context B
useSite()  →  A
provider writes  →  B
```

Fixtures work because Vite skips prebundling `workspace:*` packages.
Design previously documented only tsdown `unbundle: true` — that keeps dist files as separate modules, but does **not** stop Vite dep-optimization of published packages.

The same class of bug applies to `useInsertHtml`, the preload registry, and CSP nonce storage.

**Chosen approach: both** — they solve different layers:

| Layer                          | What it does                                                                                                                                                    |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consolidate onto `sku/runtime` | Cohesive runtime entry: app + sku runtime share one specifier, so even if something were prebundled, provider/hooks/registries land in the same optimized chunk |
| `optimizeDeps.exclude`         | Defense in depth: Vite never clones `sku` / `sku/runtime` into `.vite/deps`, so a future relative import or new shared module cannot reintroduce the split      |

Exclude alone is the minimal bugfix.
Consolidate alone is the cleaner architecture.
Together: better module story and not vulnerable if someone later reaches a shared module via a second path.

Self-import risk (`#entries/*` → `sku/runtime` via package exports) is accepted and verified by existing SSR browser tests after the change.
If self-import mis-resolves under `@fs` / tarball, those tests fail loudly.

**1. Consolidate SSR identity onto `sku/runtime`**

Already public: `createSkuContexts`, `useInsertHtml`, `usePreloadRoute`, `getCspNonce`, entry helpers + types.

Re-export internals for sku-runtime use; mark `@internal` in JSDoc:

| Module              | Symbols                                       | Call sites to flip to `'sku/runtime'` |
| ------------------- | --------------------------------------------- | ------------------------------------- |
| Context module      | `SkuProvider`                                 | SSR client entry, `render.tsx`        |
| `insertHtml.tsx`    | `InsertHtmlProvider`, `createInsertHtmlQueue` | `render.tsx`                          |
| `preloadRoute.ts`   | `registerSiteRouteTree`                       | SSR client entry                      |
| `requestContext.ts` | `runWithSsrRequestContext`                    | `render.tsx`                          |

Leave type-only imports, Node middleware helpers, and unit tests on relative paths.
Do **not** move Document / route filtering / middleware / stream transform onto the public entry — they are not on the consumer↔sku dual path.

**2. Exclude from Vite `optimizeDeps`**

In `packages/sku/src/services/vite/plugins/config.ts` (shared config plugin, not SSR-only):

```ts
exclude: [
  'sku',
  'sku/runtime',
  ...skuContext.skipPackageCompatibilityCompilation,
],
```

Extract `SKU_VITE_OPTIMIZE_DEPS_EXCLUDE` for the plugin + a Node assert test.

**3. Docs / identity comments**

Update identity comments on the four shared modules + `ssr.ts`:

- Prefer one specifier (`sku/runtime`) for app and sku runtime that touch shared state.
- `unbundle: true` keeps one physical module in dist.
- `optimizeDeps.exclude` stops Vite from cloning published `sku` / `sku/runtime`.

**4. Regression coverage**

- Node assert: `optimizeDeps.exclude` always includes `'sku'` and `'sku/runtime'`.
- Existing SSR browser tests stay green (catches self-import breakage under workspace link).
- Skip new tarball `sku start` e2e for now; exclude is what published installs need, consolidate is structural.

**Validate:** `pnpm format` → `pnpm build` → `pnpm lint` → scoped tests (new assert + SSR browser).

**Out of scope for this decision:** consumer Vite config injection, and moving non-identity Managed Data Mode helpers onto `sku/runtime`.

### 27. Naming: Managed Data Mode, `sku/runtime`, SSR render type

Separate naming layers — do not collapse them into one word:

| Layer                          | Name                              | Role                                                                                                                                                                                                 |
| ------------------------------ | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenSpec change / git branch   | `vite-ssr`                        | Historical workstream id only — do **not** use in product docs, templates, public APIs, or user-facing copy                                                                                          |
| Living OpenSpec capabilities   | `managed-data-mode`, `ssr`, `csp` | Product-surface specs synced into `openspec/specs/`. Change-local `fixtures` is review-only and is not intended to become a living capability. `vite-ssr` / `vite-ssr-csp` are not capability names. |
| Architecture / docs descriptor | **Managed Data Mode**             | Sku-owned Document + React Router Data Mode contract (Decision 3). Use when describing the kind of API, comparing to webpack SSR / today’s static, or noting what SSR and a future Static path share |
| Render strategy                | **SSR** / **Static**              | Selected by `buildType`. Product copy says “SSR”, never “Vite SSR”                                                                                                                                   |
| Create template                | **`ssr`**                         | `@sku-lib/create --template ssr` (not `vite-ssr`)                                                                                                                                                    |
| Public import                  | **`sku/runtime`**                 | Browser-safe Managed Data Mode entry (Decision 26 consolidate + `optimizeDeps.exclude` target)                                                                                                       |
| Public types / symbols         | Drop `Ssr`                        | e.g. `SkuProvider`, `createSkuContexts`, `SkuRouteObject`, `SkuServerEntry` / `SkuClientEntry`, `SkuGetSite`, …                                                                                      |

**Why not `sku/runtime`:**
The import carries contract APIs that are not SSR-specific (`define*Entry`, `createSkuContexts`, `useSite`, …).
SSR is a render strategy; the entry is the application runtime.

**Why not `sku/react-router`:**
Bad branding, couples the public surface to a peer, misses Document/CSP/entries, and is awkward when Managed Data Mode is the default path.

**Why `sku/runtime`:**
Matches sku owning more in-app runtime code, is strategy- and bundler-agnostic, and survives Static adoption and “becomes the only API.”

**Docs language:**

- Prefer **Managed Data Mode** when describing the API shape shared by new SSR and (eventually) new Static.
- Prefer **SSR** when referring only to `buildType: 'ssr'` / streaming HTML per request.
- Prefer **Webpack SSR** when referring to the older `renderCallback` path.
- Do not lead with “Vite SSR” outside this change’s OpenSpec / branch name.

**End state (this change has not shipped):**
Public contracts use the names above.
No compatibility aliases for prior in-branch names are required in product docs.

## Risks / Trade-offs

| Risk                                              | Mitigation                                                                                                                                                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Dual `routes` hydration mismatch                  | Eliminated by first-class `routesEntry` (one module in both graphs). No runtime tree checker.                                                                                                          |
| Wrong-site tree / foreign path match              | Pre-filter `sites` into per-site trees before RR. `getSite` (or sole resolved site) selects. Serialize `site` for client. Fail closed on invalid or unknown site.                                      |
| App omits or invents `site`                       | Empty config `sites` soft-defaults to `'default'`. Multi-site requires `getSite` at init. Hard-error if return is non-string or not a resolved site name. 0–1 site uses sole name when getter omitted. |
| Duplicate parse across getters                    | Accepted. Docs say keep getters sync/pure. Shared libs memoise on `req`.                                                                                                                               |
| Accidental site splits                            | No `sites` inheritance. Site-specific routes must set `sites` explicitly.                                                                                                                              |
| Shell-only CSP / late scripts                     | Lazy single nonce. Hash known bootstrap bodies.                                                                                                                                                        |
| Absolute / `CDN` `publicPath`                     | Config rejects. Relative-only docs. No browser e2e for this edge case.                                                                                                                                 |
| `publicPath` coupled to basename                  | Never pass `publicPath` as RR basename. Bake `__SKU_PUBLIC_PATH__`. Fixture for `/static/...` assets.                                                                                                  |
| Start vs prod asset URLs                          | Start: Vite graph at `/`. Build/prod: `base` + Document URLs under `publicPath` from baked manifest. Optional Node static only when sibling `client/` exists.                                          |
| Sibling `client/` required for manifest           | Bake/copy Vite client manifest into `server/` at build. Production entry loads server-local manifest. No `ENOENT` on missing sibling `client/`.                                                        |
| Catch-all middleware eats `publicPath` assets     | When Node static is mounted, mount it before server-entry middleware. Middleware + Migrating docs state the order.                                                                                     |
| Server-only deploy missing runtime deps           | Deploy docs: ship `server/` with production `node_modules` (or equivalent). Server is self-contained except hashed static files, not a frozen binary.                                                  |
| Node treated as production asset origin           | Docs: recommended path is reverse proxy / object storage for `client/`. Sibling `express.static` is standalone / experimentation only.                                                                 |
| Unhashed `public` folder assets                   | Hard-error if `paths.public` exists. Disable `publicDir` / `copyPublicFiles` for SSR. Migrating + docs cover the move.                                                                                 |
| `dangerouslySetViteConfig` / `vitePlugins` on SSR | Hard-error when set. Omit decorator plugin and consumer `vitePlugins` on SSR graph. Docs + sku-support for use-cases.                                                                                  |
| CJS “got: object” on `sku start`                  | Docs. Consumer extends interop list (no new defaults, no runtime error rewrite).                                                                                                                       |
| Mock deps ship in prod                            | `devServerMiddleware` only. Never from server entry.                                                                                                                                                   |
| Early production use                              | Experimental docs + changeset.                                                                                                                                                                         |
| Express / RR major drift                          | Keep shared Express on 4. RR 8 optional peer for SSR only. Docs + changeset mark later major bumps as potentially breaking. Express 5 deferred.                                                        |
| RR 8 peer baselines                               | Optional peer `^8`. Align engines with RR 8 minimums sku already meets. Document consumer React/Node expectations. Template installs RR 8.                                                             |
| Jest + RR 8 (webpack)                             | Out of scope: no Jest transforms in this change. SSR requires Vitest. Do not force webpack fixtures onto RR 8.                                                                                         |
| Server loaders leak to client                     | Migrating: split server-only modules. Explicit `moduleId` when lazy is non-idiomatic.                                                                                                                  |
| Braid reset before Braid on start                 | Docs: reset early on server graph. No sku auto-inject.                                                                                                                                                 |
| `window` providers in Document SSR                | Migrating: client `getReactContext` + root-layout / `useEffect` consumers.                                                                                                                             |
| Jest apps on SSR                                  | Migrating: Vitest prerequisite. Link existing Vitest docs / codemod.                                                                                                                                   |
| Nested `@vocab/vite/runtime`                      | Sku `createRequire` + `resolve.alias`. Validate translations SSR without consumer pin.                                                                                                                 |
| Bare `src/` imports under Vite                    | Migrating: `#` `pathAliases` + `migrate-root-resolution`.                                                                                                                                              |
| Per-request `createStaticHandler`                 | `SkuProvider` sits outside the router so sku never wraps the tree. Pre-build handler per site at init. Assert `render` does not import `createStaticHandler`.                                          |
| `createSkuContexts` / render context split        | Decision 26: consolidate sku runtime onto `sku/runtime` + `optimizeDeps.exclude`. `unbundle: true` alone is not enough for published installs. Node assert + browser tests.                            |
| Express `req` stuffed into context                | Red warning: project values via dual `getRouterContext` (from `clientContext` / `reactContext` when possible). Never put raw `req` in `RouterContextProvider`.                                         |
| Framework-only `getLoadContext` copy              | Dual entry required for Data Mode client navs. Server-only API is a non-goal.                                                                                                                          |
| Server-only loaders as default                    | Docs steer render-time content loading. Loaders for waterfalls / document redirects / headers / opt-in `getRouterContext` only.                                                                        |
| Start FOUC without SSR-CSS                        | Document `assets.css` gets the virtual stylesheet on `sku start`. Production stays on manifest CSS.                                                                                                    |
| Telemetry missing on SSR start                    | Mount `telemetryPlugin` on SSR graph. Client scripts via client entry / bootstrap. Mark `initialPageLoad` on ready.                                                                                    |
| Apps cannot reach the stream                      | `useInsertHtml` on `sku/runtime`. Sku flushes queued nodes between React chunks. `stream-insert-html` fixture proves Apollo hydration end to end.                                                      |
| Transport scripts blocked by CSP                  | Injected bodies are unhashable post-shell. Nonce already minted before `pipe`. Docs show server `getReactContext` returning `extraScriptProps={{ nonce: getCspNonce() }}`.                             |
| `useInsertHtml` throws off the SSR path           | Silent no-op with no injection context — client graph included. Covered by tests.                                                                                                                      |
| Duplicate queries after hydration                 | Fixture asserts server-run queries are served from the transported cache and that a post-hydration query still fetches.                                                                                |
| Wrong transport build resolved                    | Apollo ships separate `browser` / `node` condition builds and asserts on mismatch. Fixture exercises both `sku start` and production.                                                                  |
| Injection lost under `waitForAll`                 | Buffer to `onAllReady` and write injected nodes in stream order. Covered by tests.                                                                                                                     |
| Transport module duplicated in graph              | Decision 26 dual fix (same as `getCspNonce` / preload / `SkuProvider`). Exclude stops `.vite/deps` clone. Consolidate keeps one specifier.                                                             |
| Self-import `#entries/*` → `sku/runtime`          | Accepted. SSR browser tests fail loudly if package exports / `@fs` mis-resolve under workspace or tarball-like layouts.                                                                                |
| Published install dual React context              | `optimizeDeps.exclude` for `sku` + `sku/runtime`. Consolidate so provider and hooks share one entry. Skip dedicated tarball e2e this pass.                                                             |
| Trust proxy off unless configured                 | Opt-in `expressTrustProxy`. Template sets `true`. Other values via `onListen`.                                                                                                                         |
| `onListen` re-fired on server-entry HMR           | Call once after successful listen. Do not re-invoke on every start HMR reload of the server entry.                                                                                                     |

## Migration Plan

Adoption is opt-in via `buildType` + Vite.
Webpack SSR apps that leave `buildType` unset stay on the existing path.
Rollback is a config-only revert: remove `buildType`.

New apps scaffold from `--template ssr`.
The template uses named `Component` on lazy pages and sets `expressTrustProxy: true` in config.

Existing apps follow Migrating docs.
Key topics include:

- Ports and deploy layout (single `port`, `dist/server/server.js`, baked server-local manifest, recommended external assets vs standalone Node static, production `node_modules`).
- CJS interop for `sku start`.
- Express 4 typing and React Router 8 as an optional peer.
- Named `Component` on lazy pages.
- `routesEntry` + flat `routes` + optional `sites` + `getSite`.
- `defineServerEntry` / `defineClientEntry` replacing `onRequest`, plus optional `middleware` / `onListen` / `onHydrate`.
- Webpack `onStart` → `onListen` + config `expressTrustProxy`.
- `createSkuContexts<typeof …>` + three value channels + root-layout wrapping.
- Moving off config `public`.
- The data-loading hierarchy, optional `getRouterContext`, and the red warning against Express `req` in router context.
- Apollo streaming transport via `useInsertHtml` + root-layout provider instead of `getDataFromTree`.
- Server-only loaders, Braid reset order, and client-only libraries via `getReactContext`.
- Jest → Vitest, `#` `pathAliases`, and sku-owned `@vocab/vite`.

## Open Questions

- **Docs diagram format for the three channels?** Prefer a Markdown table (and optional nested list) in product docs. VitePress has no built-in Mermaid; the site does not ship `vitepress-plugin-mermaid` today. Adding Mermaid is optional polish later — do not block docs on it.
