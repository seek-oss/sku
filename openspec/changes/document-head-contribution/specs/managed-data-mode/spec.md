## ADDED Requirements

### Requirement: Root layout owns the HTML document

The root layout route MUST render `<html>`, `<head>`, and `<body>`.
Sku MUST NOT wrap the router in a sku-owned `<html>`.

App providers MAY wrap `<html>` so nodes in `<head>` see the same context as the rest of the document.

#### Scenario: Root layout supplies html

- **WHEN** sku streams a document
- **AND** the root layout renders `<html>`, `<head>`, and `<body>`
- **THEN** the response HTML’s `<html>` comes from that layout
- **AND** sku does not emit a second wrapping `<html>`

#### Scenario: Providers can wrap html

- **WHEN** the root layout wraps `<html>` with an app provider
- **AND** a non-hoistable `<style>` is a child of `<head>`
- **THEN** that `<style>` is a descendant of `<head>` in the SSR HTML
- **AND** it can read that provider

### Requirement: HeadAssets emits sku document links

Sku MUST export `HeadAssets` from `sku/runtime`.
`HeadAssets` MUST emit Document CSS `<link rel="stylesheet">` and `modulepreload` `<link>` elements from sku-owned asset URLs for that document.
Dev SSR CSS MUST still mark the virtual stylesheet href with `data-ssr-css`.

Sku MUST mount the asset context outside the router on server stream and client hydrate.
Public `sku/runtime` MUST NOT export that provider.

Omitting `HeadAssets` from the tree MUST NOT throw.
Charset, viewport, and `html lang` are app-owned.

#### Scenario: HeadAssets in head emits css and modulepreload

- **WHEN** the root layout renders `HeadAssets` inside `<head>`
- **AND** the document has CSS and modulepreload URLs
- **THEN** those `<link>`s appear inside `<head>` in the SSR HTML
- **AND** the hydrate tree renders the same component

#### Scenario: Omitting HeadAssets does not throw

- **WHEN** the root layout renders `<html>` and omits `HeadAssets`
- **THEN** sku still streams the document
- **AND** sku-owned CSS and modulepreload links are absent

### Requirement: ErrorBoundary must not replace the html layout

An `ErrorBoundary` on the route that renders `<html>` replaces that layout on failure.
Apps MUST put `ErrorBoundary` on a descendant route so the document layout stays mounted.

#### Scenario: Child route ErrorBoundary keeps html

- **WHEN** the root layout renders `<html>`
- **AND** `ErrorBoundary` is on a child route
- **AND** that child fails
- **THEN** the response still includes the root layout’s `<html>`

## MODIFIED Requirements

### Requirement: Managed Data Mode naming

Product docs and public APIs MUST describe this architecture as **Managed Data Mode**.
Sku owns streaming, hydration, and React Router Data Mode wiring.
The root layout owns `<html>`.
Apps own routes, data, providers, and the Document element tree.

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

- **WHEN** an app imports Managed Data Mode helpers (`defineServerEntry`, `createSkuContexts`, `useInsertHtml`, `HeadAssets`, …)
- **THEN** the import specifier is `sku/runtime`

### Requirement: Optional server and client request exports

`serverEntry` / `clientEntry` MUST each **`export default`** one object.
Sku MUST read that default export and call optional properties on it.

Sku MUST export `defineServerEntry` / `defineClientEntry` from `sku/runtime` as zero-runtime identity helpers that infer types from getter returns and type later sibling args (`NoInfer` on input positions).
`defineServerEntry` MUST infer `Site` from `getSite`, `Language` from `getLanguage`, `ClientContext` from `getClientContext`, and `ReactContext` from `getReactContext`, and MUST type later sibling `site` args as that `Site`.
`ClientContext` and `ReactContext` inference MUST unwrap with `Awaited`.
`defineClientEntry` MUST accept an optional `ServerEntry` type argument (`defineClientEntry<typeof server>`).
When that argument is provided, it MUST extract `Site` from the server entry’s `getSite` return (`string` when omitted) and `ClientContext` from `getClientContext` (`undefined` when omitted), reuse the same extractors as `createSkuContexts`, and MUST type client sibling `site` / `clientContext` args (including `onHydrate`) from those extracted types.
`defineClientEntry` MUST still infer `ReactContext` from the client entry’s own `getReactContext` return.
That inference MUST unwrap with `Awaited`.
When the `ServerEntry` type argument is omitted, `ClientContext` MUST be `undefined` and client `site` args MUST be `string`.
Sku MUST also export structural types `SkuServerEntry` / `SkuClientEntry` (the shapes behind those helpers).

Server entry object MAY include `getSite`, `getLanguage`, `getClientContext`, and `getReactContext`.
It MAY also include optional `middleware`, `onListen`, `getRouterContext`, and `instrumentations`.

Client entry object MAY include optional `onHydrate`, `getReactContext`, `getRouterContext`, and `instrumentations`.

All listed properties are optional.
When `getSite` is omitted, sku uses the sole resolved site name (see the site-selection requirement).

Sku MUST NOT specially gate on entry file existence.
A missing file fails via normal module resolution.

Sku MUST call getters in this order before `query()`: `getSite` (when present) → `getLanguage` → `getClientContext` → `getReactContext` → optional server `getRouterContext`.
Sku MUST await `getClientContext`, `getReactContext`, and server `getRouterContext` when they return a Promise.

Later getters MUST receive already-resolved sibling values so apps can project without re-deriving:

- `getSite` / `getLanguage` / `getClientContext` receive `{ req }` only (Express after consumer middleware)
- Server `getReactContext` receives `{ req, site, clientContext }`
- Client `getReactContext` receives `{ site, clientContext }` from the hydrate bootstrap
- Server `getRouterContext` receives `{ request, req, site, clientContext, reactContext }`
- Client `getRouterContext` receives `{ site, clientContext, reactContext }`

`getSite` and `getLanguage` MUST be synchronous.
`getClientContext` and dual-entry `getReactContext` MAY return a Promise.
Dual-entry `getRouterContext` MAY return a Promise.
React Router awaits client `getContext`.
When the client entry includes `getReactContext`, sku MUST await it before creating the browser router and hydrating.
Sku MUST NOT pass `res` into getters or `getRouterContext`.
Sku MUST NOT pass Fetch `Request` into `getSite` / `getLanguage` / `getClientContext` (Fetch stays on `query()` and optional server `getRouterContext`).

When `getLanguage` is omitted or returns `undefined`, sku MUST NOT register a vocab language chunk.
When `getClientContext` is omitted or returns `undefined`, `clientContext` is `undefined` on both SSR and hydrate.
The bootstrap MUST emit JS `undefined` (not JSON `null`).
An explicit `null` return MUST serialise as JSON `null`.
`ClientContext` MUST be typed as `JsonValue | undefined`.
`JsonValue` object values MAY be `JsonValue | undefined`.
When `getClientContext` returns a non-`undefined` value, sku MUST normalise it before sibling getters, `SkuProvider`, and bootstrap serialisation.
Object keys whose value is `undefined` MUST be dropped.
`undefined` array elements MUST become `null`.
When `getReactContext` is omitted, `reactContext` is `undefined`.
Sku MUST NOT forward `language` to the client.
Sku MUST NOT serialise `reactContext` into the hydrate bootstrap.

When the client entry includes `onHydrate`, sku MUST invoke it with `{ clientContext }` only.
That value is the same normalised value that `SkuProvider` and the hydrate bootstrap see.
Omitting `onHydrate` MUST mean no hydrate side effects (not an error).

Omitting `middleware` MUST mean no consumer middleware layer (not an error).

Omitting `onListen` MUST mean no post-listen callback (not an error).
SSR defines `onListen` call timing and failure behaviour.

Sku MUST always render `SkuProvider` outside the router, with `site`, `clientContext`, and `reactContext` for that document.
The tree is `SkuProvider` → router → root layout.
The root layout owns `<html>`, `<head>`, and `<body>`.
Sku MUST NOT wrap the router in a sku-owned `<html>`.

Sku MUST export `createSkuContexts<typeof server, typeof client>()` from `sku/runtime` so apps can obtain typed `useSite` / `useClientContext` / `useReactContext` bound to that provider.
`createSkuContexts` MUST extract `Site` from the server entry’s `getSite` return (`string` when `getSite` is omitted), `ClientContext` from `getClientContext`, and `ReactContext` from both entries’ `getReactContext` returns (union when they differ).
Those `ClientContext` and `ReactContext` extractions MUST unwrap with `Awaited`.
`useClientContext()` and `useReactContext()` MUST return those unwrapped types.
`useSite()` MUST return that `Site` type.
That same `Site` MUST type `SkuRouteObject.sites` when apps write `SkuRouteObject<SiteOf<typeof server>>`.
Apps MAY alias that type next to `createSkuContexts` in `src/skuContext.ts`.
Product docs and fixtures MUST import that alias into `routesEntry`.
They MUST NOT import the server entry into `routesEntry` for that typing.
`createSkuContexts` MUST NOT return a `defineRoutes` helper.
`createSkuContexts` MUST NOT extract a language React hook from `getLanguage` in this change.
Apps MUST NOT be required to declare hand-written `ClientContext` / `ReactContext` / site aliases.
`createSkuContexts` MUST NOT ship per-property `defineGet*` helpers.

Sku MUST NOT support an app-authored dual-entry `Providers` / `SkuProvidersProps` export in this change.

Router-aware wrapping and isomorphic provider mounts are **not** a sku concern.
An example is Apollo reading `useReactContext()`.
Apps express them as their own root layout route in `routesEntry`.

Request-entry getters / `onHydrate` MUST NOT return a provider component.

When the server entry includes `getRouterContext`, sku MUST call it before `query()` with the sibling args above and pass the returned `RouterContextProvider` as `requestContext` to `query()`.

When the client entry includes `getRouterContext`, sku MUST map it into `createBrowserRouter({ getContext })`, wrapping RR’s zero-arg API to pass `{ site, clientContext, reactContext }`.

Omitting either `getRouterContext` MUST preserve today’s empty/default context behaviour.

Loaders, actions, and route middleware read those values via `context.get()`.

Sku MUST NOT make Express `req` the loader `request` argument (`query()` continues to use Fetch `Request` only).

#### Scenario: Default export is the request-entry contract

- **WHEN** sku loads `serverEntry` or `clientEntry`
- **THEN** it uses the module’s default export as the entry object
- **AND** calls optional getter / middleware / hydrate properties on that object

#### Scenario: Getters run before query with sibling projection

- **WHEN** an SSR app handles a document request
- **THEN** sku invokes present getters in order before `query()`
- **AND** sku awaits `getClientContext` and `getReactContext` when they return a Promise
- **AND** later getters receive already-resolved `site` / `clientContext` / `reactContext`
- **AND** `clientContext` passed to later getters is the normalised JSON value
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
- **AND** awaits the result when it is a Promise
- **AND** passes the resolved value to `SkuProvider` as `reactContext`
- **AND** does not serialise it into the hydrate bootstrap

#### Scenario: getClientContext may return a Promise

- **WHEN** server `getClientContext` returns a Promise
- **THEN** sku awaits it before `getReactContext`, `getRouterContext`, and `query()`
- **AND** sibling getters and `SkuProvider` receive the resolved, normalised value
- **AND** the hydrate bootstrap serialises that normalised value

#### Scenario: Nested undefined in clientContext is normalised before consumers

- **WHEN** `getClientContext` returns `{ userId: undefined, tags: [undefined] }`
- **THEN** sibling getters, `SkuProvider`, and the hydrate bootstrap receive `{ tags: [null] }`

#### Scenario: Client getReactContext may return a Promise

- **WHEN** the client entry’s `getReactContext` returns a Promise
- **THEN** sku awaits it before creating the browser router and hydrating
- **AND** `SkuProvider` receives the resolved `reactContext`

#### Scenario: Optional server getRouterContext seeds query requestContext

- **WHEN** the server entry includes `getRouterContext`
- **AND** a document request is handled
- **THEN** sku calls server `getRouterContext` with `{ request, req, site, clientContext, reactContext }` before `query()`
- **AND** awaits the result when it is a Promise
- **AND** passes the resolved `RouterContextProvider` as `requestContext` to `query()`

#### Scenario: Optional client getRouterContext seeds createBrowserRouter

- **WHEN** the client entry includes `getRouterContext`
- **AND** the browser router is created
- **THEN** sku maps that function into `createBrowserRouter({ getContext })`
- **AND** each call receives `{ site, clientContext, reactContext }`
- **AND** that mapped function MAY return a Promise
- **AND** React Router awaits `getContext`

#### Scenario: Omitting getRouterContext keeps default behaviour

- **WHEN** an entry omits `getRouterContext`
- **THEN** sku does not require it
- **AND** React Router uses today’s empty/default context behaviour

#### Scenario: SkuProvider always wraps the router

- **WHEN** sku renders an SSR document (server or client)
- **THEN** it renders `SkuProvider` around the router provider
- **AND** it does not wrap the router in a sku-owned `<html>`
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

#### Scenario: Async getter return types unwrap

- **WHEN** `getClientContext` or `getReactContext` is declared `async` or returns a Promise
- **THEN** `createSkuContexts` hook return types are the resolved value, not `Promise<T>`
- **AND** later sibling getter args are typed as that resolved value

#### Scenario: defineClientEntry types from ServerEntry

- **WHEN** an app wraps its client default export in `defineClientEntry<typeof server>`
- **AND** the server entry’s `getClientContext` returns a narrowed shape (e.g. `{ fromServer: true; userId: string | null }`)
- **AND** `getSite` returns a narrowed site union (e.g. `'au' | 'nz'`)
- **THEN** `onHydrate` / client `getReactContext` / client `getRouterContext` receive `clientContext` typed as that shape
- **AND** client sibling `site` args are typed as that site union
- **AND** client `ReactContext` is still inferred from the client’s own `getReactContext` return
- **AND** that inference unwraps a Promise return

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

#### Scenario: SkuRouteObject sites typed from the same SiteOf

- **WHEN** `getSite` returns `'au' | 'nz'`
- **AND** the app types `routes` as `SkuRouteObject<SiteOf<typeof server>>[]` next to `createSkuContexts`
- **THEN** `sites` is typed as `('au' | 'nz')[]`
- **AND** `useSite()` is typed as `'au' | 'nz'`

#### Scenario: Omitting getSite leaves useSite as string

- **WHEN** the server entry omits `getSite` (single-site)
- **THEN** `useSite()` is typed as `string`

### Requirement: Shared Managed Data Mode modules keep one identity under Vite

App code that imports shared Managed Data Mode state from `sku/runtime` (hooks from `createSkuContexts`, `useInsertHtml`, `usePreloadRoute`, `HeadAssets`, CSP nonce helpers) and sku’s own Managed Data Mode runtime (`SkuProvider`, insert-html queue/provider, HeadAssets provider, preload registry, request-context runner) MUST observe the **same** module instances.

Sku MUST:

1. Keep public `sku/runtime` limited to the consumer contract.
2. Mount sku-only shared-state symbols via private package `imports` (for example `#runtime/*`), not via public exports marked `@internal`.
3. Exclude `'sku'` and `'sku/runtime'` from Vite `optimizeDeps` in the shared Vite config plugin so published installs are not cloned into `.vite/deps`.

Public `sku/runtime` modules MUST re-export from the same physical shared files that those private `#` imports resolve to.
tsdown `unbundle: true` alone MUST NOT be treated as sufficient for published-package identity.

Sku MUST NOT require consumers to inject their own Vite `optimizeDeps` config for this identity.
Sku MUST NOT export sku-only shared-state symbols (`SkuProvider`, insert-html queue/provider, HeadAssets provider, site route registration, request-context runner) from public `sku/runtime`.

#### Scenario: Hooks read values from SkuProvider

- **WHEN** an app uses `createSkuContexts` hooks under sku’s always-on `SkuProvider`
- **THEN** the hooks receive the provider values for that document (no dual-context “must be used within SkuProvider” failure solely from Vite prebundling `sku/runtime`)

#### Scenario: optimizeDeps excludes sku and sku/runtime

- **WHEN** sku builds the shared Vite config used by Managed Data Mode SSR (and static Vite)
- **THEN** `optimizeDeps.exclude` includes `'sku'` and `'sku/runtime'`

#### Scenario: Public runtime does not export sku-only mounts

- **WHEN** an app imports from `sku/runtime`
- **THEN** the public surface does not include `SkuProvider`, insert-html queue/provider helpers, HeadAssets provider, site route registration, or the request-context runner
- **AND** those symbols remain reachable only through sku’s private package `imports`
