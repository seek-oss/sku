# Spec Delta

## ADDED Requirements

### Requirement: Production server output runs without the app's node_modules

`sku build` for an SSR app MUST produce a `server/` directory that starts with `node server.mjs` when no `node_modules` directory is reachable from it.

Node.js built-in modules MAY stay external.

`sku start` MUST keep dependencies external.

The server entry MUST be `server/server.mjs`, and every JavaScript file in `server/` MUST use the `.mjs` extension, so Node loads them as ES modules regardless of any `package.json` above `server/`.

#### Scenario: Server starts from an isolated copy

- **WHEN** a consumer runs `sku build` for an SSR app
- **AND** copies `server/` to a directory with no `node_modules` in it or any parent directory
- **AND** runs `node server.mjs` there with `PORT` set
- **THEN** the process listens on `PORT`
- **AND** a document request returns a streamed HTML response

#### Scenario: Server starts under a CommonJS package.json

- **WHEN** a consumer copies `server/` into a directory whose parent has a `package.json` with `"type": "commonjs"`
- **AND** runs `node server.mjs` there with `PORT` set
- **THEN** the process listens on `PORT`

#### Scenario: Dependencies that are not compile packages are included

- **WHEN** an SSR app's server graph imports a package that is not in `compilePackages`
- **THEN** `sku build` includes that package's code in `server/`
- **AND** the server output does not import it by bare specifier

#### Scenario: Packages a sku-mounted plugin marks external are included

- **WHEN** a plugin that sku mounts marks a package as external for SSR (for example a styling runtime)
- **AND** the production server graph imports that package
- **THEN** `sku build` includes that package's code in `server/`

#### Scenario: One copy of React is bundled

- **WHEN** sku's runtime and the app resolve different installed copies of React or React Router at build time
- **THEN** the server output contains one copy of each
- **AND** document requests render without hook errors

#### Scenario: Start keeps dependencies external

- **WHEN** a consumer runs `sku start` for an SSR app
- **THEN** sku loads dependencies that are not compile packages from `node_modules`

## MODIFIED Requirements

### Requirement: Deploy-to-production docs cover SSR runtime layout

Deploy-to-production docs MUST cover:

- production entry `node dist/server/server.mjs` and sibling build `client/` + `server/` layout
- that `server/` is self-contained: it starts with `node server.mjs` without `node_modules` or a package install
- that `server/server.mjs`, the baked server-local manifest inside `server/`, and the `PORT` environment variable are the stable deploy contract
- that Document asset URLs come from a baked server-local Vite client manifest (server starts without sibling `client/`)
- that productionised services SHOULD host hashed `client/` assets via reverse proxy or persistent storage, not from the Node process
- that shipping sibling `client/` so Node can `express.static` them is standalone / experimentation only
- relative `publicPath` only (no absolute / CDN asset base)

#### Scenario: Deploy docs cover runtime package and asset hosting

- **WHEN** a reader opens SSR deploy-to-production docs
- **THEN** docs state that `server/` starts with `node server.mjs` without `node_modules` or a package install
- **AND** docs list `server/server.mjs`, the server-local manifest, and `PORT` as the deploy contract
- **AND** docs recommend reverse proxy / persistent storage for hashed `client/` assets
- **AND** docs describe sibling `client/` + Node `express.static` as standalone / experimentation only
- **AND** docs state the server starts without sibling `client/` once the baked manifest is present

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
- production entry path `node dist/server/server.mjs` and sibling `client/` + `server/` layout
- that Document assets resolve from a baked server-local manifest (no sibling `client/` required to start)
- that productionised deploys host `client/` via reverse proxy / persistent storage
- Node `express.static` of sibling `client/` is standalone / experimentation only
- that production Node deploys need only `server/`, without runtime `node_modules` (unlike webpack SSR)
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
- **AND** docs state the production server entry is `dist/server/server.mjs` with sibling `client/` and `server/` build outputs
- **AND** docs state Document assets resolve from a baked server-local manifest
- **AND** docs state the production deploy needs only `server/`, without runtime `node_modules`
- **AND** docs recommend hosting hashed assets outside Node for productionised deploys
- **AND** docs note optional Node static of sibling `client/` under `publicPath` before server-entry middleware for standalone use

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
