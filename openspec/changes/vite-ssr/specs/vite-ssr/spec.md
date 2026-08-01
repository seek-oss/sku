## ADDED Requirements

### Requirement: Vite SSR mode is selected via buildType

Vite SSR MUST be enabled with `bundler: 'vite'` and `buildType: 'ssr'`, using `sku start` / `sku build`.

Omitting `buildType` or using `static` MUST leave static / existing webpack-SSR behaviour unchanged.

#### Scenario: buildType enables Vite SSR

- **WHEN** config sets `bundler: 'vite'` and `buildType: 'ssr'`
- **AND** `routesEntry` exports named `routes`
- **AND** `serverEntry` / `clientEntry` each default-export an entry object
- **THEN** `sku start` and `sku build` treat the project as a Vite SSR app

#### Scenario: static remains static

- **WHEN** config sets `buildType: 'static'` (or omits `buildType` with today’s static default)
- **THEN** sku does not treat the project as a Vite SSR app

### Requirement: Webpack is rejected for ssr mode

`buildType: 'ssr'` MUST only be valid with the Vite bundler.

This edge case MUST NOT require a dedicated browser e2e fixture.

#### Scenario: webpack plus ssr errors

- **WHEN** config sets webpack and `buildType: 'ssr'`
- **THEN** config validation fails stating that mode is not supported with webpack

### Requirement: Suffixed SSR commands error when buildType is set

When `buildType` is set, `sku start-ssr` and `sku build-ssr` MUST fail.

Consumers MUST use `sku start` and `sku build`.

This edge case MUST NOT require a dedicated browser e2e fixture.

#### Scenario: -ssr commands error when buildType is set

- **WHEN** `buildType` is set and the user runs `sku start-ssr` or `sku build-ssr`
- **THEN** the command fails and points to `sku start` / `sku build`

### Requirement: Production build emits sibling client and server directories

`sku build` for a Vite SSR app MUST produce sibling `client/` and `server/` directories under the build target (neither nested).

#### Scenario: Production build layout

- **WHEN** a consumer runs `sku build` for a Vite SSR app
- **THEN** sku produces sibling `client/` and `server/` under the build target
- **AND** neither directory is nested inside the other

### Requirement: routesEntry exports flat routes

Config MUST support `routesEntry` (default `src/routes.tsx`) for Vite SSR.

Sku MUST resolve `routesEntry` into both the server and client graphs via `__sku_alias__routesEntry`.

`routesEntry` MUST export named `routes` as `SkuSsrRouteObject[]` (flat array).

`SkuSsrRouteObject` MUST be a sku type helper `RouteObject & { sites?: string[] }` (not a wrapped React Router re-export).

Missing or non-array `routes` on `routesEntry` MUST hard-error.

Sku MUST load `routes` from `routesEntry` only.

Config `routes` (static prerender path lists) MUST NOT be used as the Vite SSR `RouteObject` entry.

#### Scenario: routesEntry supplies routes for both graphs

- **WHEN** a Vite SSR app is started or built
- **AND** `routesEntry` exports `routes`
- **THEN** sku pre-builds per-site trees from that array for document / `query` (server) and hydrate (client)

#### Scenario: Missing or invalid routes hard-error

- **WHEN** `routesEntry` omits named `routes`, or exports a non-array value
- **THEN** sku fails with a hard error naming the entry/export
- **AND** does not use `default` or soft-skip

### Requirement: Optional sites membership and getSite select site-scoped route tree

Optional `sites?: string[]` on a `SkuSsrRouteObject` declares membership:

- Omit / undefined ⇒ the route is included for **every** config site
- Present ⇒ the route is included **only** for those site names (exact match against config site names)

Sku MUST NOT inherit `sites` from parent routes to children.
Site-specific routes MUST set `sites` explicitly.

Sku MUST pre-build per-site trees from config site names + `routesEntry` `routes` at init (not per request), strip `sites` before React Router APIs, and select the pre-built tree for the resolved `site`.

Sku MUST create each site’s React Router static handler once at init and MUST NOT call `createStaticHandler` on the per-request path — per request sku only selects the pre-built handler and calls `query()` / `createStaticRouter`.

Sku MUST NOT wrap or otherwise modify the route tree to mount consumer providers (provider mounting happens outside the router — see the request-exports requirement).

Vite SSR MUST require a non-empty config `sites` array (≥1 site name). Empty `sites` MUST hard-error at config/init.

**Resolve `site`:**

- One configured site ⇒ when `getSite` is omitted, sku MUST use that sole config site name; when `getSite` is present on the server entry object, sku MUST call it and validate the return.
- Multiple configured sites ⇒ missing `getSite` property MUST hard-error at init (naming the property; same class as missing `routes` on `routesEntry`).
- Non-string `site` from `getSite`, or a `site` that is not a config site name / has no pre-built tree, MUST fail closed per request (hard error).

Sku MUST serialize that `site` into the hydrate bootstrap and select the same pre-built tree for client `createBrowserRouter`.

Sku MUST NOT derive site from config `hosts` / `sites[].host` for route-tree selection (those remain local-dev listen / setup-hosts only).

Apps own site resolution (from Express `req`, headers, app config, etc.) via sync `getSite({ req })` and per-site path _shape_ when paths differ by site.

Config `sites[].routes` (static prerender path lists) MUST NOT drive Vite SSR `RouteObject` trees.

`site` MUST NOT be passed into `onHydrate` args (`onHydrate` stays `{ clientContext }` only when exported).

#### Scenario: Empty config sites hard-errors

- **WHEN** a Vite SSR app has an empty config `sites` array
- **THEN** sku fails with a hard error at config/init

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

#### Scenario: Single configured site without getSite uses that site

- **WHEN** config defines exactly one site
- **AND** the server entry omits `getSite`
- **THEN** sku uses that sole config site name for the server handler and hydrate bootstrap

#### Scenario: getSite selects the tree

- **WHEN** `getSite` returns `site`
- **AND** that name is a config site with a pre-built tree
- **THEN** sku uses that site’s tree for the server handler
- **AND** hydrates the client router with the same site’s tree

#### Scenario: Static handler is built once per site

- **WHEN** a Vite SSR app serves multiple document requests for the same site
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

- **WHEN** `getSite` returns a `site` that is not a config site name
- **THEN** sku fails closed with a hard error for that request

#### Scenario: Foreign-site paths are not registered

- **WHEN** a route is membership-filtered out of site A’s tree
- **AND** the resolved `site` is A
- **THEN** React Router does not match that path on site A’s tree

#### Scenario: Config hosts do not select the tree

- **WHEN** config defines `sites[].host` values
- **THEN** sku still resolves `site` via `getSite` (or the sole config site)
- **AND** does not choose the tree from the request `Host` header alone

### Requirement: Optional server and client request exports

`serverEntry` / `clientEntry` MUST each **`export default`** one object.
Sku MUST read that default export and call optional properties on it.

Sku MUST export `defineServerEntry` / `defineClientEntry` from `sku/ssr` as zero-runtime identity helpers that infer types from getter returns and type later sibling args (`NoInfer` on input positions).
`defineServerEntry` MUST infer `Site` from `getSite`, `Language` from `getLanguage`, `ClientContext` from `getClientContext`, and `ReactContext` from `getReactContext`, and MUST type later sibling `site` args as that `Site`.
`defineClientEntry` MUST accept an optional `ServerEntry` type argument (`defineClientEntry<typeof server>`).
When that argument is provided, it MUST extract `Site` from the server entry’s `getSite` return (`string` when omitted) and `ClientContext` from `getClientContext` (`undefined` when omitted), reuse the same extractors as `createSkuSsrContexts`, and MUST type client sibling `site` / `clientContext` args (including `onHydrate`) from those extracted types.
`defineClientEntry` MUST still infer `ReactContext` from the client entry’s own `getReactContext` return.
When the `ServerEntry` type argument is omitted, `ClientContext` MUST be `undefined` and client `site` args MUST be `string`.
Sku MUST also export structural types `SkuSsrServerEntry` / `SkuSsrClientEntry` (the shapes behind those helpers).

Server entry object MAY include sync getters `getSite`, `getLanguage`, `getClientContext`, and `getReactContext`; optional `middleware` and `getRouterContext`.

Client entry object MAY include optional `onHydrate`, `getReactContext`, and `getRouterContext`.

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

Sku MUST always render `SkuSsrProvider` outside the router — `Document` → `SkuSsrProvider` → router — with `site`, `clientContext`, and `reactContext` for that document.

Sku MUST export `createSkuSsrContexts<typeof server, typeof client>()` from `sku/ssr` so apps can obtain typed `useSite` / `useClientContext` / `useReactContext` bound to that provider.
`createSkuSsrContexts` MUST extract `Site` from the server entry’s `getSite` return (`string` when `getSite` is omitted), `ClientContext` from `getClientContext`, and `ReactContext` from both entries’ `getReactContext` returns (union when they differ).
`useSite()` MUST return that `Site` type.
`createSkuSsrContexts` MUST NOT extract a language React hook from `getLanguage` in this change.
Apps MUST NOT be required to declare hand-written `ClientContext` / `ReactContext` / site aliases.
`createSkuSsrContexts` MUST NOT ship per-property `defineGet*` helpers.

Sku MUST NOT support an app-authored dual-entry `Providers` / `SkuSsrProvidersProps` export in this change.

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

- **WHEN** a Vite SSR app handles a document request
- **THEN** sku invokes present getters in order before `query()`
- **AND** later getters receive already-resolved `site` / `clientContext` / `reactContext`
- **AND** sku uses those values for site selection, vocab preload, `SkuSsrProvider`, and the hydrate bootstrap (`clientContext` + `site` only)

#### Scenario: Getters can read middleware-attached Express state

- **WHEN** consumer Express middleware attaches fields on `req` (e.g. `req.user`, `req.log`)
- **AND** getters run for that document request
- **THEN** getters that receive `req` can read those fields to build `site` / `language` / `clientContext` / `reactContext`

#### Scenario: Omitting middleware is not an error

- **WHEN** the server entry omits `middleware`
- **THEN** sku does not require it
- **AND** mounts no consumer middleware layer

#### Scenario: Omitting onHydrate hydrates successfully

- **WHEN** the client entry omits `onHydrate`
- **THEN** sku hydrates the document without calling a hydrate callback

#### Scenario: Optional onHydrate receives clientContext only

- **WHEN** the client entry includes `onHydrate`
- **THEN** sku invokes it with deserialized `clientContext` only (no `language`, no `reactContext`)

#### Scenario: Optional getReactContext seeds SkuSsrProvider

- **WHEN** an entry includes `getReactContext`
- **THEN** sku calls it with the sibling args for that environment
- **AND** passes the result to `SkuSsrProvider` as `reactContext`
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

#### Scenario: SkuSsrProvider always wraps the router

- **WHEN** sku renders a Vite SSR document (server or client)
- **THEN** it renders `SkuSsrProvider` between `Document` and the router provider
- **AND** the route tree is unchanged
- **AND** apps can read `site` / `clientContext` / `reactContext` via `createSkuSsrContexts` hooks

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
- **AND** `createSkuSsrContexts<typeof server, typeof client>()` exposes matching hook return types without hand-written context aliases

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

- **WHEN** `getSite` returns a narrowed site union (e.g. `'au' | 'nz'`) without a widening `SkuSsrGetSite` annotation
- **AND** the app uses `createSkuSsrContexts<typeof server, typeof client>()`
- **THEN** `useSite()` is typed as that union
- **AND** later server sibling getters receive `site` typed as that union
- **AND** `defineClientEntry<typeof server>` client sibling `site` args are typed as that union

#### Scenario: Omitting getSite leaves useSite as string

- **WHEN** the server entry omits `getSite` (single-site)
- **THEN** `useSite()` is typed as `string`

### Requirement: Full-document streaming and document hydration

Vite SSR MUST stream a React-owned HTML document.

Hydration MUST target the document root (not `#app` / `#root`).

Default pipe is `onShellReady`.

#### Scenario: Shell streams then deferred content

- **WHEN** a route suspends after the shell is ready
- **THEN** sku sends the shell first and streams the rest as it resolves

#### Scenario: Document-level hydration

- **WHEN** the client hydrates a Vite SSR response
- **THEN** hydration targets the document root (not `#app` / `#root`)

### Requirement: Apps can insert HTML into the response stream

Streaming data transports must inject serialized state into the response between React's stream chunks so it executes before hydration. Sku owns the render call and the response pipe, so sku MUST provide that seam.

Sku MUST export `useInsertHtml()` from the browser-safe `sku/ssr` subpath, returning a function that accepts `() => ReactNode`.

During document SSR, sku MUST render queued nodes to markup and write them into the response before the next React chunk, flushing any remainder at stream end.

Where no sku SSR render surrounds it, the returned function MUST be a silent no-op and MUST NOT throw.

Sku MUST NOT ship a dependency on, or configuration for, any specific data-transport or GraphQL client.

#### Scenario: Injected nodes reach the browser before hydration

- **WHEN** a component calls the function returned by `useInsertHtml` during document SSR
- **THEN** sku writes that markup into the response ahead of the next React chunk
- **AND** it appears before the client hydrates

#### Scenario: Injected scripts can carry the CSP nonce

- **WHEN** an app injects a `<script>` carrying the nonce from `getCspNonce()`
- **THEN** the response `script-src` includes that `'nonce-…'`
- **AND** the script is not required to be hashable at header-derivation time

#### Scenario: No-op off the SSR path

- **WHEN** `useInsertHtml` is called in the browser
- **THEN** the returned function does nothing and does not throw

#### Scenario: Injection survives waitForAll

- **WHEN** a matched route sets `handle.waitForAll` and the app injects nodes
- **THEN** the buffered document still contains the injected markup in stream order

### Requirement: Apollo streaming hydration is proven by a fixture

A fixture MUST demonstrate Apollo Client streaming hydration on Vite SSR, using an app-owned transport built on `useInsertHtml`, dual-entry `getReactContext` for `makeClient` / server `extraScriptProps`, and an isomorphic Apollo provider mounted in the app’s root layout via `useReactContext()`.

#### Scenario: Server-run queries hydrate from the transported cache

- **WHEN** a page runs a query during document SSR and the browser hydrates
- **THEN** the rendered data survives hydration unchanged
- **AND** the browser does not refetch that query

#### Scenario: Queries issued after hydration still fetch

- **WHEN** the app issues a new query after hydration (for example on client navigation)
- **THEN** that query fetches from the GraphQL endpoint normally

### Requirement: Vite SSR client loads config polyfills

Sku’s Vite SSR browser client entry MUST import `virtual:sku/polyfills` before hydrate / consumer client-entry code, so config `polyfills` are included in the client graph (parity with static Vite and webpack SSR client entries).

`polyfillsPlugin` MAY remain on the shared Vite plugin graph. Polyfills MUST NOT be loaded into the Node server entry solely for this requirement.

#### Scenario: Configured polyfills load on the Vite SSR client

- **WHEN** a Vite SSR app configures non-empty `polyfills`
- **AND** the browser loads the Vite SSR client entry
- **THEN** those polyfill modules are imported before hydrate / consumer client-entry code

#### Scenario: Empty polyfills remain a no-op

- **WHEN** a Vite SSR app uses the default empty `polyfills` array
- **THEN** the client entry still imports `virtual:sku/polyfills`
- **AND** that virtual module contributes no polyfill imports

### Requirement: Streaming SSR responses do not use transformIndexHtml

Vite SSR document responses MUST NOT call `transformIndexHtml`.

#### Scenario: Stream path skips HTML transform

- **WHEN** a Vite SSR document response is generated
- **THEN** the body is the React render stream
- **AND** `transformIndexHtml` is not invoked for that response

### Requirement: Vite SSR start injects collected SSR CSS via Document assets

On Vite SSR `sku start`, sku MUST mount `vitePluginSsrCss` (or equivalent) so CSS reachable from the SSR module graph is available as the virtual stylesheet used by static Vite start.

Sku MUST include that virtual stylesheet URL in Document `assets.css` so the streamed document emits a stylesheet `<link>` without calling `transformIndexHtml`.

Sku MUST provide HMR cleanup for that start-only stylesheet via the browser client entry and/or `bootstrapModules` (not via `transformIndexHtml`).

Production Vite SSR MUST obtain CSS from the client manifest → Document path and MUST NOT depend on this start-only virtual stylesheet for production responses.

#### Scenario: sku start document includes virtual SSR CSS link

- **WHEN** a Vite SSR app that imports CSS runs `sku start`
- **AND** a document response is streamed
- **THEN** the document includes a stylesheet link for the SSR-CSS virtual module
- **AND** `transformIndexHtml` is not invoked for that response

#### Scenario: Production CSS does not use the start-only virtual stylesheet

- **WHEN** a Vite SSR app runs `sku build` / production
- **THEN** document CSS links come from the client manifest
- **AND** the start-only SSR-CSS virtual stylesheet is not required for those responses

### Requirement: Vite SSR start emits page-load and HMR telemetry

On Vite SSR `sku start`, sku MUST mount serve-only telemetry comparable to static Vite start, including Vite WS handlers for page-load and HMR timing.

Sku MUST deliver the page-load and HMR client scripts via the Vite SSR browser client entry and/or `bootstrapModules` (not via `transformIndexHtml`, and not as new Document inline scripts solely for telemetry).

Sku MUST mark `initialPageLoad` when the SSR dev server is ready (parity with static start), and MUST emit `start.initial` and `start.rebuild` metrics with Vite SSR-identifying tags (e.g. `type: 'ssr'`).

#### Scenario: Initial page-load telemetry on Vite SSR start

- **WHEN** a Vite SSR app runs `sku start` with tab open enabled
- **AND** the browser completes the initial document load with HMR connected
- **THEN** sku emits `start.initial` telemetry tagged for Vite SSR

#### Scenario: HMR rebuild telemetry on Vite SSR start

- **WHEN** a Vite SSR app runs `sku start`
- **AND** an HMR update completes in the browser
- **THEN** sku emits `start.rebuild` telemetry tagged for Vite SSR

#### Scenario: Telemetry clients are not injected via transformIndexHtml

- **WHEN** a Vite SSR document response is generated during `sku start`
- **THEN** telemetry client scripts are not delivered through `transformIndexHtml`

### Requirement: waitForAll buffers until onAllReady

When a matched route sets `handle.waitForAll: true`, sku MUST wait for `onAllReady` before starting the HTML response body.

#### Scenario: waitForAll buffers until onAllReady

- **WHEN** a matched route has `handle.waitForAll: true`
- **THEN** sku pipes the HTML body only after `onAllReady`

### Requirement: Client disconnect aborts render before write

When the client disconnects before HTML headers are committed, sku MUST abort the stream and MUST NOT write the document body.

Dev and production MUST share this abort-before-write behaviour.

#### Scenario: Disconnect before headers

- **WHEN** the client disconnects before HTML headers are committed
- **THEN** sku aborts the stream and does not write the document body

### Requirement: Loader and action Responses are forwarded

When React Router returns a `Response` from `query` (for example a redirect), sku MUST forward that response instead of streaming HTML.

#### Scenario: Loader redirect Response

- **WHEN** a loader returns a redirect `Response`
- **THEN** sku forwards that status/headers/body and does not stream HTML

### Requirement: Document responses forward loader and action headers

On streamed HTML (not a short-circuit `Response`), sku MUST forward `loaderHeaders` / `actionHeaders` (including `Set-Cookie`) plus sku-owned headers such as `Content-Type` and CSP.

#### Scenario: Loader Set-Cookie on HTML response

- **WHEN** a loader contributes `Set-Cookie` and sku streams HTML
- **THEN** those headers are present alongside document `Content-Type` and CSP

### Requirement: Errored routes use the static handler status code

Errored routes MUST use `context.statusCode` and the nearest `ErrorBoundary` (or React Router’s default).

Sku MUST NOT provide a separate error-page API.

#### Scenario: Errored route uses statusCode

- **WHEN** React Router records a route error on the static handler context
- **THEN** the HTML response status is `context.statusCode`
- **AND** the body is the nearest `ErrorBoundary`

### Requirement: Hydration bootstrap is production-safe

Sku MUST scrub Promises from loader/action data before bootstrap stringify.

Sku MUST omit `Error.stack` from production hydration error payloads.

When `clientContext` is omitted or `undefined`, the hydrate bootstrap MUST assign `window.__SKU_CLIENT_CONTEXT__=undefined` (JS `undefined`, not JSON `null`) so SSR and hydrate agree with the typed omit contract. An explicit `null` `clientContext` MUST still serialise as JSON `null`.

#### Scenario: Promises do not break serialization

- **WHEN** loader or action data contains Promises at serialize time
- **THEN** sku scrubs them and serialization does not throw solely because of them

#### Scenario: Production route errors omit stacks

- **WHEN** a route error is serialized into the hydration bootstrap in production
- **THEN** the payload MUST NOT include `Error.stack`

#### Scenario: Omitted clientContext stays undefined across hydrate

- **WHEN** `getClientContext` is omitted or returns `undefined`
- **THEN** the bootstrap emits `window.__SKU_CLIENT_CONTEXT__=undefined`
- **AND** SSR and hydrate `SkuSsrProvider` both receive `undefined` (not `null`)

### Requirement: Server-entry middleware runs before HTML render

When the server entry includes Express/Connect `middleware`, sku MUST mount it before the HTML render path in start and production.

Omitting `middleware` MUST NOT be an error.

#### Scenario: Server-entry middleware before HTML

- **WHEN** the server entry includes `middleware`
- **THEN** it handles matching requests before sku streams HTML

#### Scenario: Omitting server-entry middleware

- **WHEN** the server entry omits `middleware`
- **THEN** sku mounts no consumer middleware layer
- **AND** HTML render still succeeds

### Requirement: Dev middleware mounts first and stays out of production

When config `devServerMiddleware` is set, `sku start` MUST mount it before server-entry `middleware`, and MUST NOT include that module in the production server bundle.

`devServerMiddleware` MUST remain optional.

#### Scenario: Dev middleware first and out of production

- **WHEN** config sets `devServerMiddleware` and the user runs `sku start`
- **THEN** that middleware runs before server-entry `middleware`
- **AND** the production server build does not include that module

### Requirement: Per-route async chunks are supported

Vite SSR MUST support lazy route modules as separate async chunks.

The Vite SSR fixture MUST demonstrate at least two lazy routes that resolve to distinct client chunks.

#### Scenario: Distinct lazy route chunks

- **WHEN** the Vite SSR fixture defines ≥2 lazy route modules
- **THEN** they resolve to distinct client chunks that participate in SSR and hydration

### Requirement: Lazy-route moduleId is auto-derived

For idiomatic `lazy: () => import('…')`, sku MUST auto-derive `handle.moduleId`.

Explicit `handle.moduleId` MUST take precedence.

Non-idiomatic shapes MUST be skipped.

In development, a missing or unknown `moduleId` MUST produce a warning.

#### Scenario: Idiomatic lazy route gets modulepreload

- **WHEN** a matched route uses idiomatic `lazy` without `handle.moduleId`
- **THEN** production document assets include a modulepreload for that chunk

#### Scenario: Explicit moduleId is preserved

- **WHEN** a lazy route already sets `handle.moduleId`
- **THEN** sku does not overwrite it

### Requirement: Vite SSR Document preloads use route moduleIds only

Production Vite SSR Document CSS and `modulepreload` links MUST come from matched-route `handle.moduleId` values (and optional vocab language chunks) resolved against the Vite client manifest.

Vite SSR MUST NOT register Document preloads from `@sku-lib/vite/loadable` (Collector / `LoadableProvider` / `preloadPlugin` module-id injection).

That loadable path remains for static Vite / prerender only.

#### Scenario: Route moduleId drives Document assets

- **WHEN** a matched Vite SSR route has `handle.moduleId` present in the client manifest
- **THEN** production Document assets include that chunk’s CSS and/or modulepreload as applicable

#### Scenario: Loadable does not feed Vite SSR Document preloads

- **WHEN** a Vite SSR app renders a `@sku-lib/vite/loadable` component whose module id is registered only via the loadable collector
- **THEN** sku does not add Document CSS or modulepreload links for that module id from the collector path

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

### Requirement: Vocab language chunks are supported

When `languages` is configured for build-time vocab splitting, sku MUST register a vocab language chunk on the Document only when server `getLanguage` returns `language`.

Language is optional: if `getLanguage` is omitted or returns `undefined`, sku MUST NOT register a language chunk.

Sku MUST NOT validate the returned language against config and MUST NOT default to a sole configured language.

Language MUST be server-local for Document registration only (no client forward, no `getSkuLanguage` / `__SKU_LANGUAGE__` / baked languages define).

When vocab / `languages` is active, sku MUST resolve `@vocab/vite` from sku’s install tree and MUST alias bare `@vocab/vite/runtime` (prefer the export file) onto that copy in the shared Vite `resolve.alias` (client and SSR).

Sku MUST NOT alias the `@vocab/vite` package root (breaks subpath imports such as `@vocab/vite/chunks`).

Consumers MUST NOT need a direct `@vocab/vite` dependency for those bare imports to resolve.

#### Scenario: Language chunk from getLanguage

- **WHEN** `getLanguage` returns `language`
- **THEN** sku registers that language’s vocab chunk on the Document
- **AND** does not pass `language` to `onHydrate` or request-context

#### Scenario: No language means no language chunk

- **WHEN** `getLanguage` is omitted or returns `undefined`
- **THEN** sku does not register a vocab language chunk and the SSR response still succeeds

#### Scenario: Vocab runtime resolves from sku without consumer direct dep

- **WHEN** `languages` is set and a consumer module (including `@vocab/vite`-injected `.vocab` output) imports `@vocab/vite/runtime`
- **AND** the app does not declare a direct `@vocab/vite` dependency
- **THEN** Vite resolves that specifier to sku’s installed `@vocab/vite` via `resolve.alias`

### Requirement: Vite SSR publicPath is relative only and is the static asset prefix only

Vite SSR apps MUST use a relative `publicPath`.

Absolute `http(s)` / CDN `publicPath` MUST fail at config validation.

`publicPath` MUST configure the static asset prefix only (webpack-aligned `__SKU_PUBLIC_PATH__`).

For `sku build` / production, Vite `config.base` is an implementation detail and MUST be set to that prefix so emitted client URLs match.
The production server MUST serve client assets under `publicPath`.

For `sku start`, sku MUST ignore config `publicPath` and serve the Vite module graph from `/` (bootstrap at `/@vite/client`, etc.).
Sku MUST NOT set Vite `config.base` to `publicPath` during start.

Sku MUST NOT pass `publicPath` as the React Router `basename`, and MUST NOT treat Vite’s `import.meta.env.BASE_URL` as a product API.

Router basename MUST remain unset (effectively `/`).

Sku MUST NOT expose a first-class router-basename config option.

Absolute/CDN rejection MUST NOT require a dedicated browser e2e fixture.

The decoupled asset-prefix case MUST be covered by a fixture or equivalent test
(production document assets under `publicPath`; start bootstrap from `/`).

#### Scenario: Absolute publicPath rejected

- **WHEN** Vite SSR is enabled with an absolute `http(s)` `publicPath`
- **THEN** config validation fails stating that Vite SSR requires a relative `publicPath`

#### Scenario: publicPath does not become React Router basename

- **WHEN** a Vite SSR app sets a relative `publicPath` such as `/static/my-app`
- **AND** the browser requests an app route that does not start with that `publicPath`
- **THEN** sku streams HTML for that route (not a basename mismatch 404)
- **AND** in production, document assets are served under that `publicPath`

#### Scenario: sku start serves Vite bootstrap from root

- **WHEN** a Vite SSR app sets a relative `publicPath` such as `/static/my-app` and runs `sku start`
- **THEN** the document references bootstrap modules under `/` (e.g. `/@vite/client`)
- **AND** those URLs are served as JavaScript by Vite (not HTML / React Router 404 fallthrough)
- **AND** the document does not require assets under that `publicPath` for hydration

### Requirement: Vite SSR rejects the public assets folder

Vite SSR MUST NOT support config `public` (the folder of files copied/served as-is without content hashing).

Config always includes a `public` path (default `'public'`).

The rejection signal is that `paths.public` exists on disk — not merely that the option is set.

When that directory exists, `sku start` and `sku build` MUST hard-error and guide consumers to import assets from modules instead.

Vite SSR MUST NOT set Vite `publicDir` to that folder and MUST NOT copy public files into the build output.

This edge case MUST NOT require a dedicated browser e2e fixture.

Static Vite and webpack apps MAY keep existing `public` behaviour.

#### Scenario: Existing public directory rejected for Vite SSR

- **WHEN** Vite SSR is enabled and the configured `public` directory exists on disk
- **THEN** `sku start` / `sku build` fail with a hard error
- **AND** the error advises importing assets from scripts/modules instead of using the public assets folder

#### Scenario: Vite SSR does not copy or serve publicDir assets

- **WHEN** a Vite SSR app runs without an existing `public` directory
- **THEN** sku does not enable Vite `publicDir` for that folder
- **AND** does not copy public assets into the client build output

### Requirement: Vite SSR rejects dangerouslySetViteConfig

Vite SSR MUST NOT support `dangerouslySetViteConfig`.

Sku opens escape hatches only for known best-practice needs.

When that option is set, config validation MUST hard-error and point consumers to sku-support channels with their use-case.

Sku MUST NOT apply the `dangerouslySetViteConfig` decorator plugin on the Vite SSR plugin graph.

Static Vite MAY keep existing `dangerouslySetViteConfig` behaviour.

This edge case MUST NOT require a dedicated browser e2e fixture.

Product / Migrating / `configuration.md` docs MUST state that the option is unsupported for Vite SSR and that exceptional Vite customisation needs should go through support first.

#### Scenario: dangerouslySetViteConfig rejected for Vite SSR

- **WHEN** a Vite SSR app sets `dangerouslySetViteConfig`
- **THEN** config validation fails
- **AND** the error points consumers to sku-support channels

#### Scenario: Docs state dangerouslySetViteConfig unsupported for Vite SSR

- **WHEN** a reader opens Vite SSR product, Migrating, or `configuration.md` docs for `dangerouslySetViteConfig`
- **THEN** docs state that Vite SSR does not support the option
- **AND** docs direct exceptional Vite customisation use-cases to sku-support

### Requirement: Vite SSR uses a single port

Vite SSR MUST use config `port` for `sku start` and as the baked production default listen port (`__SKU_DEFAULT_SERVER_PORT__`).

`process.env.PORT` MUST still override the baked default at runtime.

Providing `serverPort` with Vite SSR MUST fail config validation (`serverPort` remains webpack-SSR-only).

Vite SSR config types MUST NOT accept `serverPort`.

#### Scenario: port bakes the production default listen port

- **WHEN** a Vite SSR app sets `port` and runs `sku build`
- **THEN** the production server’s baked default listen port is that `port` value
- **AND** `process.env.PORT` still overrides it when set

#### Scenario: serverPort is rejected for Vite SSR

- **WHEN** a Vite SSR app sets `serverPort`
- **THEN** config validation fails stating that Vite SSR uses `port` only

### Requirement: httpsDevServer works for Vite SSR development

When `httpsDevServer` is enabled, Vite SSR `sku start` MUST serve over HTTPS with working HMR.

Production remains HTTP.

#### Scenario: httpsDevServer start

- **WHEN** `httpsDevServer: true` and the user runs `sku start`
- **THEN** document responses succeed over HTTPS
- **AND** local URLs use `https://`

### Requirement: Teams can scaffold a Vite SSR app via create

`@sku-lib/create` MUST offer a `vite-ssr` template with non-empty config `sites` (typically one site), `routesEntry` configured, a flat `routes` scaffold with an app-owned pathless root layout route (optional route-level `sites` only when membership differs), `defineServerEntry` / `defineClientEntry<typeof server>` + `createSkuSsrContexts<typeof server, typeof client>` wiring, and realistic default-exported request-entry objects (`middleware`, optional context getters, `onHydrate` — no `routes` re-export, no `Providers`).

A single-site template MUST omit `getSite` (sku uses the sole config site name).
Multi-site examples MUST export `getSite`.

Lazy route page modules in the template MUST use the React Router Data Mode named `Component` export (not `export default`).

The static `vite` template MUST remain unchanged.

#### Scenario: Create vite-ssr template

- **WHEN** a user runs `@sku-lib/create --template vite-ssr`
- **THEN** the project is Vite SSR with non-empty config `sites` and `routesEntry` exporting flat `routes`
- **AND** the server entry exports `middleware` (and may export context getters)
- **AND** the client entry exports `onHydrate` (and may export context getters)
- **AND** the template wires `createSkuSsrContexts` and has no `Providers` export
- **AND** a single-site template omits `getSite`
- **AND** request entries do not re-export `routes`
- **AND** lazy page modules export named `Component`
- **AND** can `sku start` without further entry setup

#### Scenario: Static vite create template unchanged

- **WHEN** a user creates a project with the existing `vite` template
- **THEN** it is not configured as `buildType: 'ssr'` by default

### Requirement: CJS default-export interop is documented

Vite SSR product / Migrating docs MUST explain that some CommonJS packages resolve to a module namespace object under `sku start` SSR (React “Element type is invalid … got: object”), that production build may still succeed, and that consumers extend `__UNSAFE_EXPERIMENTAL__cjsInteropDependencies`.

Sku MUST NOT expand baked-in interop defaults beyond existing Apollo behaviour for this change.

Sku MUST NOT rewrite or wrap React render errors at runtime for this case — documentation is sufficient.

#### Scenario: Docs cover CJS interop for Vite SSR start

- **WHEN** a reader opens Vite SSR product or Migrating docs
- **THEN** docs describe the start-vs-build CJS interop failure mode
- **AND** document `__UNSAFE_EXPERIMENTAL__cjsInteropDependencies` with common open-source offender examples

### Requirement: Config types describe Vite SSR accurately

`SkuConfig` bundler JSDoc (and generated config docs derived from it) MUST NOT claim that `vite` is only supported for static apps while `buildType: 'ssr'` exists.

#### Scenario: Bundler JSDoc allows Vite SSR

- **WHEN** a reader inspects `bundler` JSDoc on `SkuConfig`
- **THEN** it reflects that Vite supports static and experimental SSR via `buildType`

### Requirement: Vite SSR uses shared Express 4 with aligned typing

The Vite SSR server runtime MUST use the same Express major as sku’s other Express-based servers (webpack SSR / `sku serve`).

That major MUST remain Express 4 for this change.

Sku MUST NOT upgrade `express` / `@types/express` from 4 → 5 as part of Vite SSR.

Migrating / product docs MUST state that consumers should target Express 4 when typing `middleware` / `SkuSsrMiddleware`.

#### Scenario: Runtime and types use Express 4

- **WHEN** a Vite SSR app runs `sku start` or the production server
- **THEN** sku’s server depends on Express 4
- **AND** published Express typings used for Vite SSR middleware align with Express 4
- **AND** webpack SSR continues to use the same Express 4 major

#### Scenario: Docs state Express 4

- **WHEN** a reader opens Vite SSR middleware or Migrating docs
- **THEN** docs state that Express 4 is the supported major for middleware typing
- **AND** docs do not require Express 5 for Vite SSR

### Requirement: Vite SSR ships on React Router 8 (optional peer)

Vite SSR MUST target React Router 8 via an **optional peerDependency** `react-router: ^8` (not a hard sku dependency).

Vite SSR fixtures and the create template MUST install React Router 8.

Webpack / static apps MUST NOT be forced onto React Router 8 by this change.

Sku MUST NOT add Jest transforms for `react-router` / `cookie-es` / `import.meta` in this change. Vite SSR requires Vitest; React Router 8 + Jest is out of scope.

Migrating / product docs MUST state that Vite SSR consumers should install and target React Router 8 for Data Mode / route typing.

#### Scenario: Optional peer is React Router 8

- **WHEN** a Vite SSR app installs `react-router` to satisfy sku’s peer
- **THEN** the supported major is React Router 8
- **AND** sku does not hard-depend on `react-router` in a way that hoists RR 8 into non–Vite-SSR apps

#### Scenario: Docs state React Router 8 peer

- **WHEN** a reader opens Vite SSR product or Migrating docs
- **THEN** docs state that React Router 8 is the supported major for Data Mode / route typing
- **AND** docs state consumers must install `react-router` (optional peer)

### Requirement: Express and React Router major upgrades may be breaking

Product docs and release notes for Vite SSR MUST state that bumping the Express or React Router major integrated by Vite SSR may be a breaking change.

Consumer `middleware` / `devServerMiddleware` mount into sku’s Express app, and consumer routes/entries use React Router Data Mode APIs.

This change MUST NOT itself bump Express; an Express 4 → 5 upgrade remains a deferred sku-wide breaking change.

#### Scenario: Docs warn major upgrades may break

- **WHEN** a reader opens Vite SSR product docs covering middleware or React Router / routes
- **THEN** docs state that Express and React Router major upgrades may be breaking for Vite SSR consumers

### Requirement: Vite SSR first release is documented as experimental

The first release MUST be documented as experimental (testing only; not for production) in product docs and the changeset.

Sku MUST NOT add a runtime experimental gate.

#### Scenario: Docs warn experimental

- **WHEN** a reader opens Vite SSR product docs
- **THEN** an experimental / not-for-production warning is present near the start
- **AND** the changeset states the same

### Requirement: Product and Migrating docs cover Vite SSR topics

Vite SSR product docs MUST cover `routesEntry` + flat `routes`, optional `sites` membership, `getSite` tree selection (required when config has >1 site; sole config site when omitted on single-site), default-exported request-entry objects via `defineServerEntry` / `defineClientEntry<typeof server>` with optional getters (`getSite` / `getLanguage` / `getClientContext` / `getReactContext`) and sibling projection, always-on `SkuSsrProvider` + `createSkuSsrContexts<typeof server, typeof client>()`, optional `middleware` / `onHydrate`, the three value channels vs the app-owned root layout route, middleware layers, CSP, response headers, data-loading hierarchy, and optional dual-entry `getRouterContext`, and MUST include Migrating docs for Static App and Older / Webpack SSR App.

Docs MUST diagram the three value channels with a Markdown table (and MAY use a nested list). Docs MUST NOT require Mermaid or a VitePress Mermaid plugin for this coverage.

Migrating docs MUST also cover:

- named `Component` (not default export) for lazy routes
- `routesEntry` + flat `routes` + optional `sites` + `getSite` (required when config has >1 site; fail closed on unknown / non-string site; sole config site when omitted on single-site)
- default-exported request-entry objects via `defineServerEntry` / `defineClientEntry<typeof server>` instead of an `onRequest` value return bag; optional `middleware` / `onHydrate`
- multi-site membership via `sites` on routes (not `routesBySite` maps, dual-entry `routes` re-exports, optional language path params, union tree + allowlist, or sku host matching as the product story)
- webpack dual-port (`port` + `serverPort`) vs Vite SSR single `port` (`serverPort` rejected; production still honours `PORT`)
- production entry path `node dist/server/server.js` and sibling `client/` + `server/` layout
- CJS interop for `sku start`
- Express 4 typing alignment (shared with webpack SSR; no Express 5 in this change)
- React Router 8 as optional peerDependency for Data Mode / route typing (template/fixtures install it)
- that Express / React Router major upgrades may be breaking (middleware + Data Mode integration)
- that this change does not ship Jest transforms for React Router 8
- moving off config `public` / the public assets folder (import assets in modules instead; pattern discouraged)
- that `dangerouslySetViteConfig` is unsupported for Vite SSR (hard-error when set; raise use-cases via sku-support)
- keeping server-only loader modules out of the client-imported route graph (split trees; set `handle.moduleId` when lazy factories are non-idiomatic)
- prefer render-time React data loading via Suspense with clients from `useReactContext` / `useClientContext`; use loaders for avoiding heavily-nested waterfalls, document redirects, response headers, or opt-in `getRouterContext` — not as the default for page content
- Apollo streaming hydration end to end: an app-owned transport over `useInsertHtml`, dual-entry `getReactContext` for `makeClient` / server nonce `extraScriptProps`, isomorphic provider in the root layout via `useReactContext()`, and that Apollo apps must drop two-pass `getDataFromTree`
- that loader-transported query refs (`@apollo/client-integration-react-router`'s `apolloLoader` / `preloadQuery`) are not supported, because sku's hydration bootstrap is JSON and promise-scrubbed
- that loader `request` stays Fetch; Express `req` is available where designed on getters / server `getRouterContext`, not as the loader `request` argument
- that early getters do not receive Fetch `Request` or `res`, and MUST stay synchronous / pure (libs may memoise on `req`); later getters receive sibling values
- optional dual-entry `getRouterContext` (Data Mode vs Framework Mode; server seeds from middleware bag + Fetch `request` + siblings; client seeds from browser-visible state + siblings; same `createContext` keys; different construction; cadence: once per document `query` vs every client nav/fetcher)
- how to type Express `req` fields appended by middleware (module augmentation of `express-serve-static-core` `Request`, shared by `middleware` / getters / server `getRouterContext`; same pattern as sku’s `getCspNonce`)
- relation of Express `middleware` vs RR route `middleware` vs entry `getRouterContext`, and of `getClientContext` / `getReactContext` / `SkuSsrProvider` hooks vs the app’s root layout route vs `getRouterContext` (loader/action context)
- that wrapping which needs React Router hooks or loader data belongs in the app’s own root layout route in `routesEntry`
- a **red warning** that apps MUST NOT put Express `req` (or other non-isomorphic platform objects) into `RouterContextProvider` — project values both sides can supply
- a client-navigation example where context is re-seeded without Express for a location different from the initial SSR location
- for Braid apps: reset must run before any Braid-touching server module on `sku start` (start evaluation order can differ from production build)
- libraries that touch `window` must not run in the Document SSR tree (prefer client `getReactContext` + root-layout / `useEffect` consumers)
- Jest → Vitest as a Vite SSR prerequisite (point at existing Vitest docs / `@sku-lib/codemod jest-to-vitest`)
- path aliases: bare `src/…` / webpack `baseUrl` → `#src/…` via `pathAliases` (point at existing migrate-root-resolution guidance)

Docs MUST NOT tell consumers to install `@vocab/vite` solely so `@vocab/vite/runtime` resolves (sku owns that pin via Vite alias).

#### Scenario: Primary Vite SSR docs have topic coverage

- **WHEN** a reader opens Vite SSR product docs
- **THEN** docs cover `routesEntry`, `SkuSsrProvider` / `createSkuSsrContexts`, the three value channels, the app-owned root layout route, flat `routes`, optional `sites`, `getSite`, `defineServerEntry` / `defineClientEntry<typeof server>`, optional `middleware` / `onHydrate`, CSP, and response headers
- **AND** docs steer page content toward render-time data loading with clients from `useReactContext` / `useClientContext` (not loaders as the default)
- **AND** docs describe loaders as opt-in for deeply-nested waterfalls, document redirects, response headers, or opt-in `getRouterContext`
- **AND** docs document optional dual-entry `getRouterContext` and Data Mode vs Framework Mode seeding
- **AND** docs show how to type middleware-appended Express `req` fields via `express-serve-static-core` module augmentation
- **AND** docs include a red warning against putting Express `req` into `RouterContextProvider`
- **AND** docs include a client-navigation example where context works for a non-initial location without Express
- **AND** docs show a complete Apollo streaming setup with `useInsertHtml`, `getReactContext` + root-layout provider, the nonce on injected scripts, and why loader-transported query refs are unsupported

#### Scenario: Migrating docs exist

- **WHEN** a reader opens Vite SSR Migrating docs
- **THEN** there are self-contained **Migrate from Static App** and **Migrate from Older / Webpack SSR App** docs

#### Scenario: Migrating covers port model and deploy layout

- **WHEN** a reader opens **Migrate from Older / Webpack SSR App** docs
- **THEN** docs explain webpack dual-port → Vite SSR single `port` (drop `serverPort`; `PORT` still overrides production)
- **AND** docs state the production server entry is `dist/server/server.js` with sibling `client/` and `server/` directories

#### Scenario: Docs discourage public assets folder for Vite SSR

- **WHEN** a reader opens Vite SSR product or Migrating docs (and `configuration.md` for `public`)
- **THEN** docs state that Vite SSR does not support the public assets folder
- **AND** recommend importing assets from modules instead
- **AND** Migrating notes that existing `public` folder usage must be moved off before adopting Vite SSR

#### Scenario: Docs discourage dangerouslySetViteConfig for Vite SSR

- **WHEN** a reader opens Vite SSR product or Migrating docs (and `configuration.md` for `dangerouslySetViteConfig`)
- **THEN** docs state that Vite SSR does not support `dangerouslySetViteConfig`
- **AND** docs direct exceptional Vite customisation use-cases to sku-support

#### Scenario: Migrating covers Older SSR adoption topics

- **WHEN** a reader opens **Migrate from Older / Webpack SSR App** docs
- **THEN** docs remind readers to keep server-only loader modules off the client route graph
- **AND** docs steer away from putting raw Express `req` into loaders or `RouterContextProvider` for page content
- **AND** docs point at dual-entry `getRouterContext` for projecting isomorphic values when loader context is needed
- **AND** docs note Braid reset-before-Braid on `sku start` for Braid apps
- **AND** docs note that `window`-touching providers must not run in the SSR tree
- **AND** docs treat Jest → Vitest as a Vite SSR prerequisite and point at existing Vitest guidance
- **AND** docs do not require a direct `@vocab/vite` dependency solely for `@vocab/vite/runtime` resolve
- **AND** docs point bare `src/…` imports at `#` `pathAliases` / migrate-root-resolution
