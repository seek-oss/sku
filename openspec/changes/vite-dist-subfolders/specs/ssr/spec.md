## RENAMED Requirements

- FROM: `### Requirement: Production build emits sibling client and server directories`
- TO: `### Requirement: Production build emits sibling resources and server directories`

## MODIFIED Requirements

### Requirement: Production build emits sibling resources and server directories

`sku build` for an SSR app MUST produce sibling `resources/` and `server/` directories under the build target (neither nested).

`sku build` MUST bake or copy the Vite client manifest into the server output so the production server entry can resolve Document assets without reading a sibling `resources/` path at runtime.

#### Scenario: Production build layout

- **WHEN** a consumer runs `sku build` for an SSR app
- **THEN** sku produces sibling `resources/` and `server/` under the build target
- **AND** neither directory is nested inside the other
- **AND** the server output includes a Vite client manifest usable without a sibling `resources/` directory

#### Scenario: Production server starts without sibling resources

- **WHEN** a consumer runs the production server entry with `server/` deployed and no sibling `resources/` directory
- **AND** the baked server-local manifest is present
- **THEN** the process starts and can stream HTML Document responses
- **AND** it does not fail with `ENOENT` opening `resources/.vite/manifest.json`

### Requirement: SSR publicPath is relative only and is the static asset prefix only

SSR apps MUST use a relative `publicPath`.

Absolute `http(s)` / CDN `publicPath` MUST fail at config validation.

`publicPath` MUST configure the static asset prefix only (webpack-aligned `__SKU_PUBLIC_PATH__`).

For `sku build` / production, Vite `config.base` is an implementation detail and MUST be set to that prefix so emitted client URLs match.

Production Document asset URLs MUST come from the baked server-local Vite client manifest (see the production build layout requirement).

In production, when a sibling `resources/` directory exists next to `server/`, sku MUST mount `express.static` for `publicPath` **before** server-entry `middleware`, so existing client assets are served even when that middleware would otherwise handle (or return for) the same path.

When no sibling `resources/` directory exists, sku MUST NOT mount `express.static` for that prefix and MUST NOT fail solely because the directory is absent.

Node serving hashed assets via `express.static` is a standalone / experimentation convenience.
Productionised deploys MUST be documented as hosting those assets via a reverse proxy or persistent storage ahead of (or instead of) the Node process.

For `sku start`, sku MUST ignore config `publicPath` and serve the Vite module graph from `/` (bootstrap at `/@vite/client`, etc.).
Sku MUST NOT set Vite `config.base` to `publicPath` during start.

Sku MUST NOT pass `publicPath` as the React Router `basename`, and MUST NOT treat Vite’s `import.meta.env.BASE_URL` as a product API.

Router basename MUST remain unset (effectively `/`).

Sku MUST NOT expose a first-class router-basename config option.

#### Scenario: Absolute publicPath rejected

- **WHEN** SSR is enabled with an absolute `http(s)` `publicPath`
- **THEN** config validation fails stating that SSR requires a relative `publicPath`

#### Scenario: publicPath does not become React Router basename

- **WHEN** an SSR app sets a relative `publicPath` such as `/static/my-app`
- **AND** the browser requests an app route that does not start with that `publicPath`
- **THEN** sku streams HTML for that route (not a basename mismatch 404)
- **AND** in production, document asset URLs use that `publicPath` prefix

#### Scenario: Production static assets before server-entry middleware when resources exists

- **WHEN** an SSR production server has a sibling `resources/` directory
- **AND** server-entry `middleware` that handles every request without calling `next`
- **AND** a client asset exists under `publicPath`
- **THEN** that asset is still served from the static mount
- **AND** the middleware does not handle that asset request

#### Scenario: Missing sibling resources does not fail startup

- **WHEN** an SSR production server runs without a sibling `resources/` directory
- **AND** the baked server-local manifest is present
- **THEN** the process starts successfully
- **AND** sku does not mount `express.static` for `publicPath`

#### Scenario: sku start serves Vite bootstrap from root

- **WHEN** an SSR app sets a relative `publicPath` such as `/static/my-app` and runs `sku start`
- **THEN** the document references bootstrap modules under `/` (e.g. `/@vite/client`)
- **AND** those URLs are served as JavaScript by Vite (not HTML / React Router 404 fallthrough)
- **AND** the document does not require assets under that `publicPath` for hydration

### Requirement: Product docs cover core SSR topics

SSR product docs MUST describe Managed Data Mode vs SSR and the core app contract:

- `routesEntry` + `routes` with optional `sites` membership
- `SkuRouteObject<SiteOf<typeof server>>` for multi-site `sites` typing (same `Site` as `useSite`)
- optional `mapRoutePath` for per-site multi-path pages, including index homes via `path: ''` (and correct preload-safe examples)
- case-sensitive path matching by default (`caseSensitive: true` when omitted) and per-route `caseSensitive: false` opt-out
- `getSite` tree selection
- sole resolved site when `getSite` is omitted on 0–1 site
- soft-default `'default'` when config `sites` is empty
- default-exported request entries via `defineServerEntry` / `defineClientEntry<typeof server>` with optional getters and sibling projection
- always-on `SkuProvider` + `createSkuContexts<typeof server, typeof client>()` in `src/skuContext.ts`
- optional `middleware` / `onListen` / `onHydrate` / dual-entry `instrumentations` and config `expressTrustProxy`
- the three value channels vs the root layout route
- production middleware order: request-context → optional `express.static(publicPath)` when sibling `resources/` exists → server-entry `middleware` → HTML
- `sku start` middleware order: request-context → Vite → optional `devServerMiddleware` → server-entry `middleware` → HTML
- CSP, response headers, data-loading hierarchy, and optional dual-entry `getRouterContext`

Docs MUST briefly document optional dual-entry `instrumentations` pass-through to `createStaticHandler` / `createBrowserRouter`.
Docs MUST note that static handlers accept route-level instrumentations only, while the browser router accepts router + route levels.
Docs MUST link to React Router’s instrumentation guide.
Docs MUST NOT add a dedicated SSR Logging product page in this change.

Docs MUST diagram the three value channels with a Markdown table (and MAY use a nested list).
Docs MUST NOT require Mermaid or a VitePress Mermaid plugin for this coverage.

Docs MUST NOT tell consumers to install `@vocab/vite` solely so `@vocab/vite/runtime` resolves (sku owns that pin via Vite alias).

#### Scenario: Primary SSR docs have topic coverage

- **WHEN** a reader opens SSR product docs
- **THEN** docs cover `routesEntry`, `SkuProvider` / `createSkuContexts` in `src/skuContext.ts`, the three value channels, the root layout route, named `routes`, optional `sites`, `SkuRouteObject<SiteOf<typeof server>>`, optional `mapRoutePath`, case-sensitive path matching by default with per-route opt-out, `getSite`, `defineServerEntry` / `defineClientEntry<typeof server>`, optional `middleware` / `onListen` / `onHydrate` / `instrumentations`, `expressTrustProxy`, CSP, and response headers
- **AND** docs steer page content toward render-time data loading with clients from `useReactContext` / `useClientContext` (not loaders as the default)
- **AND** docs describe loaders as opt-in for deeply-nested waterfalls, document redirects, response headers, or opt-in `getRouterContext`
- **AND** docs document optional dual-entry `getRouterContext` and Data Mode vs Framework Mode seeding
- **AND** docs document optional dual-entry `instrumentations` and the server route-only vs client router+route split
- **AND** docs link to React Router’s instrumentation guide
- **AND** docs show how to type middleware-appended Express `req` fields via `express-serve-static-core` module augmentation
- **AND** docs include a red warning against putting Express `req` into `RouterContextProvider`
- **AND** docs include a client-navigation example where context works for a non-initial location without Express
- **AND** docs show a complete Apollo streaming setup with `useInsertHtml`, `getReactContext` + root-layout provider, the nonce on injected scripts via `getCspNonce` from `sku/runtime`, and why loader-transported query refs are unsupported

### Requirement: Deploy-to-production docs cover SSR runtime layout

Deploy-to-production docs MUST cover:

- production entry `node dist/server/server.js` and sibling build `resources/` + `server/` layout
- that Document asset URLs come from a baked server-local Vite client manifest (server starts without sibling `resources/`)
- that productionised services SHOULD host hashed `resources/` assets via reverse proxy or persistent storage, not from the Node process
- that shipping sibling `resources/` so Node can `express.static` them is standalone / experimentation only
- that the production Node deploy MUST include runtime `node_modules` (or an equivalent production install) alongside `server/`
- relative `publicPath` only (no absolute / CDN asset base)

#### Scenario: Deploy docs cover runtime package and asset hosting

- **WHEN** a reader opens SSR deploy-to-production docs
- **THEN** docs state the production Node deploy needs `server/` plus runtime `node_modules` (or equivalent)
- **AND** docs recommend reverse proxy / persistent storage for hashed `resources/` assets
- **AND** docs describe sibling `resources/` + Node `express.static` as standalone / experimentation only
- **AND** docs state the server starts without sibling `resources/` once the baked manifest is present

### Requirement: Migrating docs cover Static and Webpack SSR adoption

SSR MUST include Migrating docs for Static App and Older / Webpack SSR App.

Migrating docs MUST cover:

- named `Component` (not default export) for lazy routes
- `routesEntry` + `routes` + optional `sites` + `getSite`
- fail closed on unknown / non-string site from `getSite`
- sole resolved site when `getSite` is omitted on 0–1 site
- soft-default `'default'` when config `sites` is empty
- `SkuRouteObject<SiteOf<typeof server>>` for multi-site `sites` typing
- optional `mapRoutePath` for per-site multi-path pages
- case-sensitive path matching by default and per-route `caseSensitive: false` opt-out
- default-exported request-entry objects via `defineServerEntry` / `defineClientEntry<typeof server>` instead of an `onRequest` value return bag
- optional `middleware` / `onListen` / `onHydrate` / `instrumentations`
- webpack `onStart` → server-entry `onListen({ app, httpServer, port })`
- trust proxy via config `expressTrustProxy` (not `onStart`)
- other trust-proxy values via `onListen`
- multi-site membership via `sites` on routes
- webpack dual-port (`port` + `serverPort`) vs SSR single `port`
- `serverPort` is rejected for SSR
- production still honours `PORT`
- production entry path `node dist/server/server.js` and sibling `resources/` + `server/` layout
- that Document assets resolve from a baked server-local manifest (no sibling `resources/` required to start)
- that productionised deploys host `resources/` via reverse proxy / persistent storage
- Node `express.static` of sibling `resources/` is standalone / experimentation only
- that production Node deploys must include runtime `node_modules` (or equivalent) with `server/`
- that when Node static is mounted, it serves under `publicPath` **before** server-entry `middleware`
- CJS interop for `sku start`
- Express 4 typing alignment, shared with webpack SSR
- no Express 5 in this change
- React Router 8 as optional peerDependency for Data Mode / route typing (create template installs it)
- that Express / React Router major upgrades may be breaking (middleware + Data Mode integration)
- that this change does not ship Jest transforms for React Router 8
- moving off config `public` / the public assets folder
- import assets in modules instead of the public folder
- public-folder pattern is discouraged
- that `dangerouslySetViteConfig` and `vitePlugins` are unsupported for SSR
- hard-error when those options are set
- raise those use-cases via sku-support
- keeping server-only loader modules out of the client-imported route graph
- split route trees so server-only loaders stay off the client graph
- set `handle.moduleId` when lazy factories are non-idiomatic
- prefer render-time React data loading via Suspense with clients from `useReactContext` / `useClientContext`
- use loaders for avoiding heavily-nested waterfalls, document redirects, response headers, or opt-in `getRouterContext`
- loaders are not the default for page content
- Apollo streaming hydration end to end: an app-owned transport over `useInsertHtml`, dual-entry `getReactContext` for `makeClient` / server nonce `extraScriptProps` via `getCspNonce` from `sku/runtime`, isomorphic provider in the root layout via `useReactContext()`, and that Apollo apps must drop two-pass `getDataFromTree`
- that loader-transported query refs (`@apollo/client-integration-react-router`'s `apolloLoader` / `preloadQuery`) are not supported, because sku's hydration bootstrap is JSON and promise-scrubbed
- that loader `request` stays Fetch
- that Express `req` is available where designed on getters / server `getRouterContext`, not as the loader `request` argument
- that `getSite` and `getLanguage` do not receive Fetch `Request` or `res`
- that `getSite` and `getLanguage` MUST stay synchronous and pure (libs may memoise on `req`)
- that `getClientContext` and dual-entry `getReactContext` MAY return a Promise
- that sku awaits those getters so hooks and sibling getters see the resolved value
- that page data still belongs in loaders / Suspense, not in those getters
- that later getters receive already-resolved sibling values
- optional dual-entry `getRouterContext`
- Data Mode vs Framework Mode for `getRouterContext`
- server `getRouterContext` seeds from middleware bag + Fetch `request` + siblings
- client `getRouterContext` seeds from browser-visible state + siblings
- same `createContext` keys with different construction
- cadence is once per document `query` vs every client nav/fetcher
- how to type Express `req` fields appended by middleware
- module augmentation of `express-serve-static-core` `Request`
- that typing is shared by `middleware` / getters / server `getRouterContext`
- same pattern as sku’s `getCspNonce` from `sku/runtime`
- relation of Express `middleware` vs RR route `middleware` vs entry `getRouterContext`, and of `getClientContext` / `getReactContext` / `SkuProvider` hooks vs the app’s root layout route vs `getRouterContext` (loaders, actions, and route middleware)
- that wrapping which needs React Router hooks or loader data belongs in the app’s own root layout route in `routesEntry`
- a **red warning** that apps MUST NOT put Express `req` (or other non-isomorphic platform objects) into `RouterContextProvider`
- project values both sides can supply instead of Express `req`
- a client-navigation example where context is re-seeded without Express for a location different from the initial SSR location
- for Braid apps: reset must run before any Braid-touching server module on `sku start` (start evaluation order can differ from production build)
- libraries that touch `window` must not run in the Document SSR tree (prefer client `getReactContext` + root-layout / `useEffect` consumers)
- Jest → Vitest as an SSR prerequisite (point at existing Vitest docs / `@sku-lib/codemod jest-to-vitest`)
- path aliases: bare `src/…` / webpack `baseUrl` → `#src/…` via `pathAliases` (point at existing migrate-root-resolution guidance)

#### Scenario: Migrating docs exist

- **WHEN** a reader opens SSR Migrating docs
- **THEN** there are self-contained **Migrate from Static App** and **Migrate from Older / Webpack SSR App** docs

#### Scenario: Migrating covers port model and deploy layout

- **WHEN** a reader opens **Migrate from Older / Webpack SSR App** docs
- **THEN** docs explain webpack dual-port → SSR single `port`
- **AND** docs state to drop `serverPort`
- **AND** docs state `PORT` still overrides production
- **AND** docs state the production server entry is `dist/server/server.js` with sibling `resources/` and `server/` build outputs
- **AND** docs state Document assets resolve from a baked server-local manifest
- **AND** docs recommend hosting hashed assets outside Node for productionised deploys
- **AND** docs note optional Node static of sibling `resources/` under `publicPath` before server-entry middleware for standalone use

#### Scenario: Migrating covers onStart and trust proxy

- **WHEN** a reader opens **Migrate from Older / Webpack SSR App** docs
- **THEN** docs map webpack `onStart` to server-entry `onListen({ app, httpServer, port })`
- **AND** docs state trust proxy is opt-in via config `expressTrustProxy` (sets hop count `1`), not via `onStart`
- **AND** docs note other trust-proxy values are set in `onListen`

#### Scenario: Migrating covers Older SSR adoption topics

- **WHEN** a reader opens **Migrate from Older / Webpack SSR App** docs
- **THEN** docs remind readers to keep server-only loader modules off the client route graph
- **AND** docs steer away from putting raw Express `req` into loaders or `RouterContextProvider` for page content
- **AND** docs point at dual-entry `getRouterContext` for projecting isomorphic values when loader context is needed
- **AND** docs note Braid reset-before-Braid on `sku start` for Braid apps
- **AND** docs note that `window`-touching providers must not run in the SSR tree
- **AND** docs treat Jest → Vitest as an SSR prerequisite and point at existing Vitest guidance
- **AND** docs do not require a direct `@vocab/vite` dependency solely for `@vocab/vite/runtime` resolve
- **AND** docs point bare `src/…` imports at `#` `pathAliases` / migrate-root-resolution
