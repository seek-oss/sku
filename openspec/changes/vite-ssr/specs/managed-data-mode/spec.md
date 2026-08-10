## ADDED Requirements

### Requirement: Managed Data Mode naming

Product docs and public APIs MUST describe this architecture as **Managed Data Mode** (sku-owned Document + React Router Data Mode wiring; apps own routes, data, and providers).

**SSR** MUST refer only to the render strategy selected by `buildType: 'ssr'`.

Docs MUST note that Managed Data Mode is intended to be shared later by a new Static path on the same contract.

The public import MUST be `sku/runtime` (not `sku/ssr` or another strategy-branded subpath).

Product docs, templates, and public APIs MUST NOT use the label `vite-ssr` (that name is reserved for this OpenSpec change / branch only).

#### Scenario: Docs describe Managed Data Mode vs SSR

- **WHEN** a reader opens SSR getting-started or Migrating docs
- **THEN** docs describe the architecture as Managed Data Mode
- **AND** use SSR for the `buildType: 'ssr'` render strategy
- **AND** note that a future Static path is expected to share the same Managed Data Mode APIs

#### Scenario: Public import is sku/runtime

- **WHEN** an app imports Managed Data Mode helpers (`defineServerEntry`, `createSkuContexts`, `useInsertHtml`, …)
- **THEN** the import specifier is `sku/runtime`

### Requirement: routesEntry exports routes

Config MUST support `routesEntry` (default `src/routes.tsx`) for Managed Data Mode apps.

Sku MUST resolve `routesEntry` into both the server and client graphs via `__sku_alias__routesEntry`.

`routesEntry` MUST export named `routes` as `SkuRouteObject[]`.

`SkuRouteObject` MUST be a sku type helper `RouteObject & { sites?: string[] }` (not a wrapped React Router re-export).

Missing or non-array `routes` on `routesEntry` MUST hard-error.

Sku MUST load `routes` from `routesEntry` only.

Config `routes` (static prerender path lists) MUST NOT be used as the Managed Data Mode `RouteObject` entry.

#### Scenario: routesEntry supplies routes for both graphs

- **WHEN** a Managed Data Mode app is started or built
- **AND** `routesEntry` exports `routes`
- **THEN** sku pre-builds per-site trees from that array for document / `query` (server) and hydrate (client)

#### Scenario: Missing or invalid routes hard-error

- **WHEN** `routesEntry` omits named `routes`, or exports a non-array value
- **THEN** sku fails with a hard error naming the entry/export
- **AND** does not use `default` or soft-skip

### Requirement: Optional sites membership and getSite select site-scoped route tree

Optional `sites?: string[]` on a `SkuRouteObject` declares membership:

- Omit / undefined ⇒ the route is included for **every** resolved site
- Present ⇒ the route is included **only** for those site names (exact match against resolved site names)

Sku MUST NOT inherit `sites` from parent routes to children.
Site-specific routes MUST set `sites` explicitly.

Sku MUST pre-build per-site trees from resolved site names + `routesEntry` `routes` at init (not per request), apply optional `mapRoutePath` after `sites` membership filtering (see mapRoutePath requirement), strip `sites` before React Router APIs, and select the pre-built tree for the resolved `site`.

Sku MUST create each site’s React Router static handler once at init and MUST NOT call `createStaticHandler` on the per-request path — per request sku only selects the pre-built handler and calls `query()` / `createStaticRouter`.

Sku MUST NOT wrap or otherwise modify the route tree to mount consumer providers (provider mounting happens outside the router — see the request-exports requirement).

Managed Data Mode MUST NOT require a non-empty config `sites` array.
Empty or omitted `sites` MUST soft-default to a single synthetic site name `'default'` for pre-build + allowlist.

**Resolve `site`:**

- Zero configured sites (soft-default `'default'`) or one configured site ⇒ when `getSite` is omitted, sku MUST use that sole resolved site name; when `getSite` is present on the server entry object, sku MUST call it and validate the return against the resolved name list.
- Multiple configured sites ⇒ missing `getSite` property MUST hard-error at init (naming the property; same class as missing `routes` on `routesEntry`).
- Non-string `site` from `getSite`, or a `site` that is not a resolved site name / has no pre-built tree, MUST fail closed per request (hard error).

Sku MUST serialize that `site` into the hydrate bootstrap and select the same pre-built tree for client `createBrowserRouter`.

Sku MUST NOT derive site from config `hosts` / `sites[].host` for route-tree selection (those remain local-dev listen / setup-hosts only).

Apps own site resolution (from Express `req`, headers, app config, etc.) via sync `getSite({ req })` and per-site path _shape_ when paths differ by site.

Config `sites[].routes` (static prerender path lists) MUST NOT drive Managed Data Mode `RouteObject` trees.

`site` MUST NOT be passed into `onHydrate` args (`onHydrate` stays `{ clientContext }` only when exported).

#### Scenario: Empty config sites soft-defaults

- **WHEN** a Managed Data Mode app has an empty or omitted config `sites` array
- **THEN** sku soft-defaults to the synthetic site name `'default'` for the pre-built tree and allowlist
- **AND** does not hard-error at config/init for empty `sites`

#### Scenario: Route without sites is on every site

- **WHEN** a route omits `sites`
- **AND** config defines multiple sites
- **THEN** that route is present in every pre-built site tree

#### Scenario: Route with sites is membership-filtered

- **WHEN** a route sets `sites: ['au']`
- **AND** config defines sites `au` and `nz`
- **THEN** the route is present only in the `au` pre-built tree

#### Scenario: No sites inheritance from parent

- **WHEN** a parent route sets `sites: ['au']`
- **AND** a child omits `sites`
- **THEN** sku does not copy the parent’s `sites` onto the child
- **AND** structural exclusion still applies (if the parent is absent for a site, its subtree is absent)

#### Scenario: Zero or one site without getSite uses that site

- **WHEN** config defines zero sites (soft-default `'default'`) or exactly one site
- **AND** the server entry omits `getSite`
- **THEN** sku uses that sole resolved site name for the server handler and hydrate bootstrap

#### Scenario: getSite selects the tree

- **WHEN** `getSite` returns `site`
- **AND** that name is a resolved site with a pre-built tree
- **THEN** sku uses that site’s tree for the server handler
- **AND** hydrates the client router with the same site’s tree

#### Scenario: Static handler is built once per site

- **WHEN** a Managed Data Mode app serves multiple document requests for the same site
- **THEN** sku reuses the static handler built for that site at init
- **AND** does not call `createStaticHandler` on the request path

#### Scenario: Multi-site missing getSite hard-errors at init

- **WHEN** config defines more than one site
- **AND** the server entry omits `getSite`
- **THEN** sku fails with a hard error at init naming the `getSite` property

#### Scenario: Non-string getSite fails closed

- **WHEN** `getSite` returns a non-string value
- **THEN** sku fails closed with a hard error for that request

#### Scenario: Unknown site fails closed

- **WHEN** `getSite` returns a `site` that is not a resolved site name
- **THEN** sku fails closed with a hard error for that request

#### Scenario: Foreign-site paths are not registered

- **WHEN** a route is membership-filtered out of site A’s tree
- **AND** the resolved `site` is A
- **THEN** React Router does not match that path on site A’s tree

#### Scenario: Config hosts do not select the tree

- **WHEN** config defines `sites[].host` values
- **THEN** sku still resolves `site` via `getSite` (or the sole resolved site)
- **AND** does not choose the tree from the request `Host` header alone

### Requirement: Optional mapRoutePath maps paths while pre-building site trees

`routesEntry` MAY export a sync named `mapRoutePath` with this signature:

```ts
mapRoutePath(args: {
  path: string;
  site: string;
  parentSegments: string[];
}): string[];
```

Sku MUST call it only while pre-building each site tree at init (not per request).
Sku MUST call it for routes that have a string `path` and for `index: true` routes.
For `index: true` routes, sku MUST pass `path: ''`.
Sku MUST NOT call it for pathless layout routes (no `path`, not index).
Sku MUST call it only on the source (pre-mapping) tree and MUST NOT call it again on clones produced by mapping.

Call order for each site tree: `sites` membership filter first, then `mapRoutePath`, then strip `sites`.

When `mapRoutePath` is omitted, sku MUST treat each path-bearing route as `[path]` and each index route as `['']` (identity).

`parentSegments` MUST list authored `path` values from path-bearing ancestors only (pathless and index ancestors omitted), not including the current route, and MUST use source (pre-mapping) segments rather than mapped paths.

The return value MUST be a `string[]`.
An empty array MUST omit that route node for the current site.

For a path-bearing source route, each returned string MUST be the clone’s `path`.
Sku MUST shallow-clone the route for each returned path, preserve `lazy` and existing `handle` (including injected `moduleId`), and clone children under each result with relative child paths unchanged.

For an `index: true` source route:

- A returned `''` MUST produce a clone that keeps `index: true` (no `path`)
- A returned non-empty string MUST produce a clone with that `path` and without `index`
- Clones MUST preserve `lazy` and existing `handle` (including injected `moduleId`) the same way as path-bearing clones

Sku MUST hard-error at init when `mapRoutePath` is present but not a function, or when a call returns a value that is not an array of strings.

Sku MUST NOT use `mapRoutePath` as a substitute for `getLanguage` / Vocab chunk selection.

Sku MUST NOT special-case catch-all or “already prefixed” segments.
Apps decide that policy inside `mapRoutePath`.

Product docs MUST teach `mapRoutePath` for multi-path pages (including index homes via `path: ''`) and MUST NOT teach sharing one `const pageLazy = () => import(…)` across hand-duplicated route objects.

#### Scenario: Omitted mapRoutePath leaves paths unchanged

- **WHEN** `routesEntry` omits `mapRoutePath`
- **AND** a route has `path: 'about'`
- **THEN** the pre-built trees keep `path: 'about'` for that route

#### Scenario: Omitted mapRoutePath leaves index unchanged

- **WHEN** `routesEntry` omits `mapRoutePath`
- **AND** a route is `index: true`
- **THEN** the pre-built trees keep that index route

#### Scenario: mapRoutePath duplicates a localisation-root path

- **WHEN** `mapRoutePath` returns `['th/about', 'about']` for `{ path: 'about', site: 'th', parentSegments: [] }`
- **THEN** site `th`’s tree includes both `th/about` and `about` route nodes
- **AND** both clones preserve the source route’s `lazy` and `handle.moduleId` when present

#### Scenario: mapRoutePath maps an index home

- **WHEN** an authored route is `index: true`
- **AND** `mapRoutePath` is called with `path: ''`
- **AND** it returns `['', 'fr']`
- **THEN** the site tree includes an `index: true` clone and a `path: 'fr'` clone of the same page
- **AND** both clones preserve the source route’s `lazy` and `handle.moduleId` when present

#### Scenario: Nested segments can opt out via parentSegments

- **WHEN** a child route has `path: 'settings'` under authored parent `path: 'account'`
- **AND** `mapRoutePath` returns `[path]` whenever `parentSegments.length > 0`
- **THEN** sku calls the hook with `parentSegments: ['account']`
- **AND** the child keeps a single `settings` segment under each expanded parent clone

#### Scenario: Empty array omits the route for that site

- **WHEN** `mapRoutePath` returns `[]` for a path-bearing route on site `nz`
- **THEN** that route node is absent from the `nz` pre-built tree

#### Scenario: Invalid mapRoutePath return hard-errors at init

- **WHEN** `mapRoutePath` returns a non-array or an array with a non-string entry
- **THEN** sku fails with a hard error at init

### Requirement: Optional server and client request exports

`serverEntry` / `clientEntry` MUST each **`export default`** one object.
Sku MUST read that default export and call optional properties on it.

Sku MUST export `defineServerEntry` / `defineClientEntry` from `sku/runtime` as zero-runtime identity helpers that infer types from getter returns and type later sibling args (`NoInfer` on input positions).
`defineServerEntry` MUST infer `Site` from `getSite`, `Language` from `getLanguage`, `ClientContext` from `getClientContext`, and `ReactContext` from `getReactContext`, and MUST type later sibling `site` args as that `Site`.
`defineClientEntry` MUST accept an optional `ServerEntry` type argument (`defineClientEntry<typeof server>`).
When that argument is provided, it MUST extract `Site` from the server entry’s `getSite` return (`string` when omitted) and `ClientContext` from `getClientContext` (`undefined` when omitted), reuse the same extractors as `createSkuContexts`, and MUST type client sibling `site` / `clientContext` args (including `onHydrate`) from those extracted types.
`defineClientEntry` MUST still infer `ReactContext` from the client entry’s own `getReactContext` return.
When the `ServerEntry` type argument is omitted, `ClientContext` MUST be `undefined` and client `site` args MUST be `string`.
Sku MUST also export structural types `SkuServerEntry` / `SkuClientEntry` (the shapes behind those helpers).

Server entry object MAY include sync getters `getSite`, `getLanguage`, `getClientContext`, and `getReactContext`; optional `middleware`, `onListen`, `getRouterContext`, and `instrumentations`.

Client entry object MAY include optional `onHydrate`, `getReactContext`, `getRouterContext`, and `instrumentations`.

`getSite` is required **only** when config `sites` has more than one entry (init hard-error when missing — see the site-selection requirement).
All other listed properties are optional.

Sku MUST NOT specially gate on entry file existence; a missing file fails via normal module resolution.

Sku MUST call getters in this order before `query()`: `getSite` (when present or required) → `getLanguage` → `getClientContext` → `getReactContext` → optional server `getRouterContext`.

Later getters MUST receive already-resolved sibling values so apps can project without re-deriving:

- `getSite` / `getLanguage` / `getClientContext` receive `{ req }` only (Express after consumer middleware)
- Server `getReactContext` receives `{ req, site, clientContext }`
- Client `getReactContext` receives `{ site, clientContext }` from the hydrate bootstrap
- Server `getRouterContext` receives `{ request, req, site, clientContext, reactContext }`
- Client `getRouterContext` receives `{ site, clientContext, reactContext }`

Getters other than optional `getRouterContext` MUST be synchronous.
Sku MUST NOT pass `res` into getters or `getRouterContext`.
Sku MUST NOT pass Fetch `Request` into `getSite` / `getLanguage` / `getClientContext` (Fetch stays on `query()` and optional server `getRouterContext`).

When `getLanguage` is omitted or returns `undefined`, sku MUST NOT register a vocab language chunk.
When `getClientContext` is omitted or returns `undefined`, `clientContext` is `undefined` on both SSR and hydrate — the bootstrap MUST emit JS `undefined` (not JSON `null`). An explicit `null` return MUST serialise as JSON `null`.
When `getReactContext` is omitted, `reactContext` is `undefined`.
Sku MUST NOT forward `language` to the client.
Sku MUST NOT serialise `reactContext` into the hydrate bootstrap.

When the client entry includes `onHydrate`, sku MUST invoke it with `{ clientContext }` only — the same value from `getClientContext`.
Omitting `onHydrate` MUST mean no hydrate side effects (not an error).

Omitting `middleware` MUST mean no consumer middleware layer (not an error).

Omitting `onListen` MUST mean no post-listen callback (not an error).
SSR defines `onListen` call timing and failure behaviour.

Sku MUST always render `SkuProvider` outside the router — `Document` → `SkuProvider` → router — with `site`, `clientContext`, and `reactContext` for that document.

Sku MUST export `createSkuContexts<typeof server, typeof client>()` from `sku/runtime` so apps can obtain typed `useSite` / `useClientContext` / `useReactContext` bound to that provider.
`createSkuContexts` MUST extract `Site` from the server entry’s `getSite` return (`string` when `getSite` is omitted), `ClientContext` from `getClientContext`, and `ReactContext` from both entries’ `getReactContext` returns (union when they differ).
`useSite()` MUST return that `Site` type.
`createSkuContexts` MUST NOT extract a language React hook from `getLanguage` in this change.
Apps MUST NOT be required to declare hand-written `ClientContext` / `ReactContext` / site aliases.
`createSkuContexts` MUST NOT ship per-property `defineGet*` helpers.

Sku MUST NOT support an app-authored dual-entry `Providers` / `SkuProvidersProps` export in this change.

Router-aware wrapping and isomorphic provider mounts (e.g. Apollo reading `useReactContext()`) are **not** a sku concern: apps express them as their own root layout route in `routesEntry`.

Request-entry getters / `onHydrate` MUST NOT return a provider component.

When the server entry includes `getRouterContext`, sku MUST call it before `query()` with the sibling args above and pass the returned `RouterContextProvider` as `requestContext` to `query()`.

When the client entry includes `getRouterContext`, sku MUST map it into `createBrowserRouter({ getContext })`, wrapping RR’s zero-arg API to pass `{ site, clientContext, reactContext }`.

Omitting either `getRouterContext` MUST preserve today’s empty/default context behaviour.

Sku MUST NOT make Express `req` the loader `request` argument (`query()` continues to use Fetch `Request` only).

#### Scenario: Default export is the request-entry contract

- **WHEN** sku loads `serverEntry` or `clientEntry`
- **THEN** it uses the module’s default export as the entry object
- **AND** calls optional getter / middleware / hydrate properties on that object

#### Scenario: Getters run before query with sibling projection

- **WHEN** an SSR app handles a document request
- **THEN** sku invokes present getters in order before `query()`
- **AND** later getters receive already-resolved `site` / `clientContext` / `reactContext`
- **AND** sku uses those values for site selection, vocab preload, `SkuProvider`, and the hydrate bootstrap (`clientContext` + `site` only)

#### Scenario: Getters can read middleware-attached Express state

- **WHEN** consumer Express middleware attaches fields on `req` (e.g. `req.user`, `req.log`)
- **AND** getters run for that document request
- **THEN** getters that receive `req` can read those fields to build `site` / `language` / `clientContext` / `reactContext`

#### Scenario: Omitting middleware is not an error

- **WHEN** the server entry omits `middleware`
- **THEN** sku does not require it
- **AND** mounts no consumer middleware layer

#### Scenario: Omitting onListen is not an error

- **WHEN** the server entry omits `onListen`
- **THEN** sku does not require it
- **AND** listen and document serving still succeed

#### Scenario: Omitting onHydrate hydrates successfully

- **WHEN** the client entry omits `onHydrate`
- **THEN** sku hydrates the document without calling a hydrate callback

#### Scenario: Optional onHydrate receives clientContext only

- **WHEN** the client entry includes `onHydrate`
- **THEN** sku invokes it with deserialized `clientContext` only (no `language`, no `reactContext`)

#### Scenario: Optional getReactContext seeds SkuProvider

- **WHEN** an entry includes `getReactContext`
- **THEN** sku calls it with the sibling args for that environment
- **AND** passes the result to `SkuProvider` as `reactContext`
- **AND** does not serialise it into the hydrate bootstrap

#### Scenario: Optional server getRouterContext seeds query requestContext

- **WHEN** the server entry includes `getRouterContext`
- **AND** a document request is handled
- **THEN** sku calls server `getRouterContext` with `{ request, req, site, clientContext, reactContext }` before `query()`
- **AND** passes the result as `requestContext` to `query()`

#### Scenario: Optional client getRouterContext seeds createBrowserRouter

- **WHEN** the client entry includes `getRouterContext`
- **AND** the browser router is created
- **THEN** sku maps that function into `createBrowserRouter({ getContext })`
- **AND** each call receives `{ site, clientContext, reactContext }`

#### Scenario: Omitting getRouterContext keeps default behaviour

- **WHEN** an entry omits `getRouterContext`
- **THEN** sku does not require it
- **AND** React Router uses today’s empty/default context behaviour

#### Scenario: SkuProvider always wraps the router

- **WHEN** sku renders an SSR document (server or client)
- **THEN** it renders `SkuProvider` between `Document` and the router provider
- **AND** the route tree is unchanged
- **AND** apps can read `site` / `clientContext` / `reactContext` via `createSkuContexts` hooks

#### Scenario: Omitting getClientContext and getReactContext is not an error

- **WHEN** an entry omits `getClientContext` and/or `getReactContext`
- **THEN** sku does not require them
- **AND** the corresponding provider values are `undefined`

#### Scenario: Router-aware wrapping is an app route

- **WHEN** an app needs wrapping that uses React Router hooks, loader data, or isomorphic provider mounts from `useReactContext`
- **THEN** it declares its own root layout route in `routesEntry`
- **AND** sku provides no dual-entry component export for that case

#### Scenario: Entry type params type sibling getter args

- **WHEN** an app wraps its server default export in `defineServerEntry`
- **THEN** later server getters’ sibling args are typed from earlier getters’ return types
- **AND** `createSkuContexts<typeof server, typeof client>()` exposes matching hook return types without hand-written context aliases

#### Scenario: defineClientEntry types from ServerEntry

- **WHEN** an app wraps its client default export in `defineClientEntry<typeof server>`
- **AND** the server entry’s `getClientContext` returns a narrowed shape (e.g. `{ fromServer: true; userId: string | null }`)
- **AND** `getSite` returns a narrowed site union (e.g. `'au' | 'nz'`)
- **THEN** `onHydrate` / client `getReactContext` / client `getRouterContext` receive `clientContext` typed as that shape
- **AND** client sibling `site` args are typed as that site union
- **AND** client `ReactContext` is still inferred from the client’s own `getReactContext` return

#### Scenario: Omitting ServerEntry on defineClientEntry

- **WHEN** an app calls `defineClientEntry` without a `ServerEntry` type argument
- **THEN** `clientContext` args are typed as `undefined`
- **AND** client `site` args are typed as `string`

#### Scenario: useSite typed from getSite return

- **WHEN** `getSite` returns a narrowed site union (e.g. `'au' | 'nz'`) without a widening `SkuGetSite` annotation
- **AND** the app uses `createSkuContexts<typeof server, typeof client>()`
- **THEN** `useSite()` is typed as that union
- **AND** later server sibling getters receive `site` typed as that union
- **AND** `defineClientEntry<typeof server>` client sibling `site` args are typed as that union

#### Scenario: Omitting getSite leaves useSite as string

- **WHEN** the server entry omits `getSite` (single-site)
- **THEN** `useSite()` is typed as `string`

### Requirement: Optional React Router instrumentations pass-through

Server and client request entries MAY include optional `instrumentations`.

Server `instrumentations` MUST use React Router’s static-handler shape (`Pick<ServerInstrumentation, "route">[]`).
When present, sku MUST forward that array into **each** site’s `createStaticHandler(routes, { instrumentations })` at module init.

Client `instrumentations` MUST use React Router’s `ClientInstrumentation[]` shape.
When present, sku MUST forward that array into `createBrowserRouter(…, { instrumentations })`.

Sku MUST NOT ship a default instrumentation.
Omitting `instrumentations` on an entry MUST call the corresponding React Router API without the option.

Sku MUST NOT wrap, filter, or compose the app’s instrumentation array.
Sku MUST keep static handlers pre-built once per site at init (instrumentations do not move `createStaticHandler` onto the request path).

Server and client `instrumentations` are separate optional fields.
Sku MUST NOT require a shared array across entries.

#### Scenario: Omitting instrumentations preserves current behaviour

- **WHEN** the server entry omits `instrumentations`
- **AND** the client entry omits `instrumentations`
- **THEN** sku calls `createStaticHandler(routes)` without an `instrumentations` option
- **AND** sku calls `createBrowserRouter(…)` without an `instrumentations` option

#### Scenario: Server instrumentations reach every site static handler

- **WHEN** the server entry provides `instrumentations`
- **THEN** sku builds each site’s static handler with `createStaticHandler(routes, { instrumentations })`
- **AND** those handlers are still created once at module init

#### Scenario: Client instrumentations reach createBrowserRouter

- **WHEN** the client entry provides `instrumentations`
- **THEN** sku creates the browser router with `createBrowserRouter(siteRoutes, { instrumentations, … })`

### Requirement: Shared Managed Data Mode modules keep one identity under Vite

App code that imports shared Managed Data Mode state from `sku/runtime` (hooks from `createSkuContexts`, `useInsertHtml`, `usePreloadRoute`, CSP nonce helpers) and sku’s own Managed Data Mode runtime (`SkuProvider`, insert-html queue/provider, preload registry, request-context runner) MUST observe the **same** module instances.

Sku MUST:

1. Keep public `sku/runtime` limited to the consumer contract.
2. Mount sku-only shared-state symbols via private package `imports` (for example `#runtime/*`), not via public exports marked `@internal`.
3. Exclude `'sku'` and `'sku/runtime'` from Vite `optimizeDeps` in the shared Vite config plugin so published installs are not cloned into `.vite/deps`.

Public `sku/runtime` modules MUST re-export from the same physical shared files that those private `#` imports resolve to.
tsdown `unbundle: true` alone MUST NOT be treated as sufficient for published-package identity.

Sku MUST NOT require consumers to inject their own Vite `optimizeDeps` config for this identity.
Sku MUST NOT export sku-only shared-state symbols (`SkuProvider`, insert-html queue/provider, site route registration, request-context runner) from public `sku/runtime`.

#### Scenario: Hooks read values from SkuProvider

- **WHEN** an app uses `createSkuContexts` hooks under sku’s always-on `SkuProvider`
- **THEN** the hooks receive the provider values for that document (no dual-context “must be used within SkuProvider” failure solely from Vite prebundling `sku/runtime`)

#### Scenario: optimizeDeps excludes sku and sku/runtime

- **WHEN** sku builds the shared Vite config used by Managed Data Mode SSR (and static Vite)
- **THEN** `optimizeDeps.exclude` includes `'sku'` and `'sku/runtime'`

#### Scenario: Public runtime does not export sku-only mounts

- **WHEN** an app imports from `sku/runtime`
- **THEN** the public surface does not include `SkuProvider`, insert-html queue/provider helpers, site route registration, or the request-context runner
- **AND** those symbols remain reachable only through sku’s private package `imports`

### Requirement: Apps can insert HTML into the response stream

Streaming data transports must inject serialized state into the response between React's stream chunks so it executes before hydration. Sku owns the render call and the response pipe, so sku MUST provide that seam.

Sku MUST export `useInsertHtml()` from the browser-safe `sku/runtime` subpath, returning a function that accepts `() => ReactNode`.

During document SSR, sku MUST render queued nodes to markup and write them into the response before the next React chunk, flushing any remainder at stream end.

Where no sku SSR render surrounds it, the returned function MUST be a silent no-op and MUST NOT throw.

Sku MUST NOT ship a dependency on, or configuration for, any specific data-transport or GraphQL client.

#### Scenario: Injected nodes reach the browser before hydration

- **WHEN** a component calls the function returned by `useInsertHtml` during document SSR
- **THEN** sku writes that markup into the response ahead of the next React chunk
- **AND** it appears before the client hydrates

#### Scenario: No-op off the SSR path

- **WHEN** `useInsertHtml` is called in the browser
- **THEN** the returned function does nothing and does not throw

#### Scenario: Injection survives waitForAll

- **WHEN** a matched route sets `handle.waitForAll` and the app injects nodes
- **THEN** the buffered document still contains the injected markup in stream order

### Requirement: Intent route preloading is a sku API

Sku MUST expose a `usePreloadRoute(to)` hook returning a zero-argument function that warms the lazy modules for `to`.

Matching MUST run against the current site's filtered route tree.

The returned function MUST NOT throw or reject when warming fails.

When no route tree is registered, the returned function MUST be a no-op.

Sku MUST NOT expose the route tree itself as a public API.

#### Scenario: Intent warms the destination chunk

- **WHEN** the returned function is invoked for a lazy destination route that is not yet loaded
- **THEN** sku requests that route’s client chunk before navigation

#### Scenario: Foreign-site path is not warmed

- **WHEN** the returned function is invoked for a path outside the current site’s tree
- **THEN** sku requests no chunk

#### Scenario: Server render is inert

- **WHEN** a component calls `usePreloadRoute` during document SSR
- **THEN** rendering succeeds and no preloading occurs

### Requirement: Managed Data Mode requires React Router 8 (optional peer)

Managed Data Mode MUST target React Router 8 via an **optional peerDependency** `react-router: ^8` (not a hard sku dependency).

Webpack / static apps MUST NOT be forced onto React Router 8 by this change.

Sku MUST NOT add Jest transforms for `react-router` / `cookie-es` / `import.meta` in this change. SSR requires Vitest; React Router 8 + Jest is out of scope.

Migrating / product docs MUST state that Managed Data Mode consumers should install and target React Router 8 for Data Mode / route typing.

#### Scenario: Optional peer is React Router 8

- **WHEN** a Managed Data Mode app installs `react-router` to satisfy sku’s peer
- **THEN** the supported major is React Router 8
- **AND** sku does not hard-depend on `react-router` in a way that hoists RR 8 into apps that do not use Managed Data Mode

#### Scenario: Docs state React Router 8 peer

- **WHEN** a reader opens Managed Data Mode / SSR product or Migrating docs
- **THEN** docs state that React Router 8 is the supported major for Data Mode / route typing
- **AND** docs state consumers must install `react-router` (optional peer)
