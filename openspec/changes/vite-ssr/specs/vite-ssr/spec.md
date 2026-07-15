## ADDED Requirements

### Requirement: Vite SSR mode is selected via renderType

Vite SSR MUST be enabled with `bundler: 'vite'` and `renderType: 'server-side-rendered'`, using `sku start` / `sku build`. Omitting `renderType` or using `static-generated` MUST leave static / existing webpack-SSR behaviour unchanged.

#### Scenario: renderType enables Vite SSR

- **WHEN** config sets `bundler: 'vite'` and `renderType: 'server-side-rendered'`
- **AND** required server and client entries export named `routes`
- **THEN** `sku start` and `sku build` treat the project as a Vite SSR app

#### Scenario: static-generated remains static

- **WHEN** config sets `renderType: 'static-generated'` (or omits `renderType` with today’s static default)
- **THEN** sku does not treat the project as a Vite SSR app

### Requirement: Webpack is rejected for server-side-rendered mode

`renderType: 'server-side-rendered'` MUST only be valid with the Vite bundler.

#### Scenario: webpack plus server-side-rendered errors

- **WHEN** config sets webpack and `renderType: 'server-side-rendered'`
- **THEN** sku fails stating that mode is not supported with webpack

### Requirement: Suffixed SSR commands error when renderType is set

When `renderType` is set, `sku start-ssr` and `sku build-ssr` MUST fail. Consumers MUST use `sku start` and `sku build`.

#### Scenario: -ssr commands error when renderType is set

- **WHEN** `renderType` is set and the user runs `sku start-ssr` or `sku build-ssr`
- **THEN** the command fails and points to `sku start` / `sku build`

### Requirement: Production build emits sibling client and server directories

`sku build` for a Vite SSR app MUST produce sibling `client/` and `server/` directories under the build target (neither nested).

#### Scenario: Production build layout

- **WHEN** a consumer runs `sku build` for a Vite SSR app
- **THEN** sku produces sibling `client/` and `server/` under the build target
- **AND** neither directory is nested inside the other

### Requirement: Server and client entries both export routes

Both `serverEntry` and `clientEntry` MUST export named `routes` as `RouteObject[]` (empty array allowed; missing or non-array MUST hard-error). Server and client trees MUST stay hydration-compatible; sku MUST NOT runtime-validate that match.

#### Scenario: Both entries export routes

- **WHEN** a Vite SSR app is started or built
- **THEN** sku uses server `routes` for document / `query` and client `routes` for hydrate

#### Scenario: Missing or non-array routes hard-error

- **WHEN** a server or client entry omits named `routes` or exports a non-array `routes` value
- **THEN** sku fails with a hard error naming the entry/export
- **AND** does not use `default` or soft-skip

### Requirement: Required server and client request exports

Server entry MUST export `onRequest` and `middleware`; client entry MUST export `onHydrate`. Missing entry files or named exports MUST hard-error (no default fallback, no noops).

`onRequest` MAY return `AppWrapper`, `language` (server Document vocab only), and `clientContext`. `onHydrate` receives `{ context }` only and MAY return `AppWrapper`. Sku MUST NOT forward `language` to the client. When `AppWrapper` is returned, sku MUST mount it as a pathless parent under the router above that side’s `routes`.

#### Scenario: onRequest and onHydrate wiring

- **WHEN** a Vite SSR app handles a document request
- **THEN** sku invokes `onRequest` before `query()`
- **AND** invokes `onHydrate` with deserialized `context` only (no `language`)

#### Scenario: AppWrapper mounts inside the router

- **WHEN** `onRequest` or `onHydrate` returns `AppWrapper`
- **THEN** sku mounts it as a pathless parent under the router above that side’s `routes`

#### Scenario: Missing named exports hard-error

- **WHEN** an entry omits a required named export (`onRequest`, `middleware`, or `onHydrate`)
- **THEN** sku fails with a hard error naming the export
- **AND** does not use `default` or soft-skip

### Requirement: Full-document streaming and document hydration

Vite SSR MUST stream a React-owned HTML document. Hydration MUST target the document root (not `#app` / `#root`). Default pipe is `onShellReady`.

#### Scenario: Shell streams then deferred content

- **WHEN** a route suspends after the shell is ready
- **THEN** sku sends the shell first and streams the rest as it resolves

#### Scenario: Document-level hydration

- **WHEN** the client hydrates a Vite SSR response
- **THEN** hydration targets the document root (not `#app` / `#root`)

### Requirement: Streaming SSR responses do not use transformIndexHtml

Vite SSR document responses MUST NOT call `transformIndexHtml`.

#### Scenario: Stream path skips HTML transform

- **WHEN** a Vite SSR document response is generated
- **THEN** the body is the React render stream
- **AND** `transformIndexHtml` is not invoked for that response

### Requirement: waitForAll buffers until onAllReady

When a matched route sets `handle.waitForAll: true`, sku MUST wait for `onAllReady` before starting the HTML response body.

#### Scenario: waitForAll buffers until onAllReady

- **WHEN** a matched route has `handle.waitForAll: true`
- **THEN** sku pipes the HTML body only after `onAllReady`

### Requirement: Client disconnect aborts render before write

When the client disconnects before HTML headers are committed, sku MUST abort the stream and MUST NOT write the document body. Dev and production MUST share this abort-before-write behaviour.

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

Errored routes MUST use `context.statusCode` and the nearest `ErrorBoundary` (or React Router’s default). Sku MUST NOT provide a separate error-page API.

#### Scenario: Errored route uses statusCode

- **WHEN** React Router records a route error on the static handler context
- **THEN** the HTML response status is `context.statusCode`
- **AND** the body is the nearest `ErrorBoundary`

### Requirement: Hydration bootstrap is production-safe

Sku MUST scrub Promises from loader/action data before bootstrap stringify, and MUST omit `Error.stack` from production hydration error payloads.

#### Scenario: Promises do not break serialization

- **WHEN** loader or action data contains Promises at serialize time
- **THEN** sku scrubs them and serialization does not throw solely because of them

#### Scenario: Production route errors omit stacks

- **WHEN** a route error is serialized into the hydration bootstrap in production
- **THEN** the payload MUST NOT include `Error.stack`

### Requirement: Server-entry middleware runs before HTML render

Sku MUST mount the server entry’s Express/Connect `middleware` before the HTML render path in start and production. The export is required (empty array or passthrough allowed).

#### Scenario: Server-entry middleware before HTML

- **WHEN** the server entry exports `middleware`
- **THEN** it handles matching requests before sku streams HTML

### Requirement: Dev middleware mounts first and stays out of production

When config `devServerMiddleware` is set, `sku start` MUST mount it before server-entry `middleware`, and MUST NOT include that module in the production server bundle. `devServerMiddleware` MUST remain optional.

#### Scenario: Dev middleware first and out of production

- **WHEN** config sets `devServerMiddleware` and the user runs `sku start`
- **THEN** that middleware runs before server-entry `middleware`
- **AND** the production server build does not include that module

### Requirement: Per-route async chunks are supported

Vite SSR MUST support lazy route modules as separate async chunks. The Vite SSR fixture MUST demonstrate at least two lazy routes that resolve to distinct client chunks.

#### Scenario: Distinct lazy route chunks

- **WHEN** the Vite SSR fixture defines ≥2 lazy route modules
- **THEN** they resolve to distinct client chunks that participate in SSR and hydration

### Requirement: Lazy-route moduleId is auto-derived

For idiomatic `lazy: () => import('…')`, sku MUST auto-derive `handle.moduleId`. Explicit `handle.moduleId` MUST take precedence. Non-idiomatic shapes MUST be skipped. In development, a missing or unknown `moduleId` MUST produce a warning.

#### Scenario: Idiomatic lazy route gets modulepreload

- **WHEN** a matched route uses idiomatic `lazy` without `handle.moduleId`
- **THEN** production document assets include a modulepreload for that chunk

#### Scenario: Explicit moduleId is preserved

- **WHEN** a lazy route already sets `handle.moduleId`
- **THEN** sku does not overwrite it

### Requirement: Vocab language chunks are supported

When `languages` is configured, sku MUST register the active vocab chunk from server `onRequest` `language` → sole configured language → soft-fail. Language MUST be server-local for Document registration only (no client forward, no `getSkuLanguage` / `__SKU_LANGUAGE__`).

#### Scenario: Language chunk from onRequest

- **WHEN** `languages` is configured and `onRequest` returns a known `language`
- **THEN** sku registers that language’s vocab chunk on the Document
- **AND** does not pass `language` to `onHydrate` or request-context

#### Scenario: Soft-fail when language unresolved

- **WHEN** multiple languages are configured and `onRequest` omits a known `language`
- **THEN** sku does not register a vocab chunk and the SSR response still succeeds

### Requirement: Vite SSR publicPath is relative only

Vite SSR apps MUST use a relative `publicPath`. Absolute `http(s)` / CDN `publicPath` MUST fail.

#### Scenario: Absolute publicPath rejected

- **WHEN** Vite SSR is enabled with an absolute `http(s)` `publicPath`
- **THEN** sku fails stating that Vite SSR requires a relative `publicPath`

### Requirement: httpsDevServer works for Vite SSR development

When `httpsDevServer` is enabled, Vite SSR `sku start` MUST serve over HTTPS with working HMR. Production remains HTTP.

#### Scenario: httpsDevServer start

- **WHEN** `httpsDevServer: true` and the user runs `sku start`
- **THEN** document responses succeed over HTTPS
- **AND** local URLs use `https://`

### Requirement: Teams can scaffold a Vite SSR app via create

`@sku-lib/create` MUST offer a `vite-ssr` template with required config/exports and a shared `createRoutes` scaffold. The static `vite` template MUST remain unchanged.

#### Scenario: Create vite-ssr template

- **WHEN** a user runs `@sku-lib/create --template vite-ssr`
- **THEN** the project is Vite SSR with dual `routes` / `createRoutes`
- **AND** can `sku start` without further entry setup

#### Scenario: Static vite create template unchanged

- **WHEN** a user creates a project with the existing `vite` template
- **THEN** it is not configured as `renderType: 'server-side-rendered'` by default

### Requirement: Vite SSR first release is documented as experimental

The first release MUST be documented as experimental (testing only; not for production) in product docs and the changeset. Docs MUST also state React 19+ as a prerequisite. Sku MUST NOT add a runtime experimental gate.

#### Scenario: Docs warn experimental

- **WHEN** a reader opens Vite SSR product docs
- **THEN** an experimental / not-for-production warning is present near the start
- **AND** the changeset states the same

#### Scenario: Docs state React 19 prerequisite

- **WHEN** a project enables Vite SSR
- **THEN** sku documentation states that React 19 or newer is required

### Requirement: Product and Migrating docs cover Vite SSR topics

`server-rendering.md` MUST cover dual-entry `routes`, AppWrapper, middleware layers, CSP, and response headers, and MUST include Migrating subsections for Static App and Older SSR App (not under `docs/migration-guides/`).

#### Scenario: Primary Vite SSR docs have topic coverage

- **WHEN** a reader opens the Vite SSR section of `server-rendering.md`
- **THEN** docs cover AppWrapper, routes, middleware, CSP, and response headers

#### Scenario: Migrating subsections exist

- **WHEN** a reader opens the Migrating section of `server-rendering.md`
- **THEN** there are self-contained **Migrate from Static App** and **Migrate from Older SSR App** subsections
