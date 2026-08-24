## ADDED Requirements

### Requirement: SSR mode is selected via buildType

SSR MUST be enabled with `bundler: 'vite'` and `buildType: 'ssr'`, using `sku start` / `sku build`.

Omitting `buildType` or using `static` MUST leave static / existing webpack-SSR behaviour unchanged.

#### Scenario: buildType enables SSR

- **WHEN** config sets `bundler: 'vite'` and `buildType: 'ssr'`
- **AND** `routesEntry` exports named `routes`
- **AND** `serverEntry` / `clientEntry` each default-export an entry object
- **THEN** `sku start` and `sku build` treat the project as an SSR app

#### Scenario: static remains static

- **WHEN** config sets `buildType: 'static'` (or omits `buildType` with today’s static default)
- **THEN** sku does not treat the project as an SSR app

### Requirement: Webpack is rejected for ssr mode

`buildType: 'ssr'` MUST only be valid with the Vite bundler.

#### Scenario: webpack plus ssr errors

- **WHEN** config sets webpack and `buildType: 'ssr'`
- **THEN** config validation fails stating that mode is not supported with webpack

### Requirement: Suffixed SSR commands error when buildType is set

When `buildType` is set, `sku start-ssr` and `sku build-ssr` MUST fail.

Consumers MUST use `sku start` and `sku build`.

#### Scenario: -ssr commands error when buildType is set

- **WHEN** `buildType` is set and the user runs `sku start-ssr` or `sku build-ssr`
- **THEN** the command fails and points to `sku start` / `sku build`

### Requirement: Production build emits sibling client and server directories

`sku build` for an SSR app MUST produce sibling `client/` and `server/` directories under the build target (neither nested).

`sku build` MUST bake or copy the Vite client manifest into the server output so the production server entry can resolve Document assets without reading a sibling `client/` path at runtime.

#### Scenario: Production build layout

- **WHEN** a consumer runs `sku build` for an SSR app
- **THEN** sku produces sibling `client/` and `server/` under the build target
- **AND** neither directory is nested inside the other
- **AND** the server output includes a Vite client manifest usable without a sibling `client/` directory

#### Scenario: Production server starts without sibling client assets

- **WHEN** a consumer runs the production server entry with `server/` deployed and no sibling `client/` directory
- **AND** the baked server-local manifest is present
- **THEN** the process starts and can stream HTML Document responses
- **AND** it does not fail with `ENOENT` opening `client/.vite/manifest.json`

### Requirement: Full-document streaming and document hydration

SSR MUST stream a React-owned HTML document.

Hydration MUST target the document root (not `#app` / `#root`).

Default pipe is `onShellReady`.

#### Scenario: Shell streams then deferred content

- **WHEN** a route suspends after the shell is ready
- **THEN** sku sends the shell first and streams the rest as it resolves

#### Scenario: Document-level hydration

- **WHEN** the client hydrates an SSR response
- **THEN** hydration targets the document root (not `#app` / `#root`)

### Requirement: SSR client loads config polyfills

Sku’s SSR browser client entry MUST import `virtual:sku/polyfills` before hydrate / consumer client-entry code, so config `polyfills` are included in the client graph (parity with static Vite and webpack SSR client entries).

`polyfillsPlugin` MAY remain on the shared Vite plugin graph. Polyfills MUST NOT be loaded into the Node server entry solely for this requirement.

#### Scenario: Configured polyfills load on the SSR client

- **WHEN** an SSR app configures non-empty `polyfills`
- **AND** the browser loads the SSR client entry
- **THEN** those polyfill modules are imported before hydrate / consumer client-entry code

#### Scenario: Empty polyfills remain a no-op

- **WHEN** an SSR app uses the default empty `polyfills` array
- **THEN** the client entry still imports `virtual:sku/polyfills`
- **AND** that virtual module contributes no polyfill imports

### Requirement: Streaming SSR responses do not use transformIndexHtml

SSR document responses MUST NOT call `transformIndexHtml`.

#### Scenario: Stream path skips HTML transform

- **WHEN** an SSR document response is generated
- **THEN** the body is the React render stream
- **AND** `transformIndexHtml` is not invoked for that response

### Requirement: SSR start injects collected SSR CSS via Document assets

On SSR `sku start`, sku MUST mount `vitePluginSsrCss` (or equivalent) so CSS reachable from the SSR module graph is available as the virtual stylesheet used by static Vite start.

Sku MUST include that virtual stylesheet URL in Document `assets.css` so the streamed document emits a stylesheet `<link>` without calling `transformIndexHtml`.

Sku MUST provide HMR cleanup for that start-only stylesheet via the browser client entry and/or `bootstrapModules` (not via `transformIndexHtml`).

Production SSR MUST obtain CSS from the client manifest → Document path and MUST NOT depend on this start-only virtual stylesheet for production responses.

#### Scenario: sku start document includes virtual SSR CSS link

- **WHEN** an SSR app that imports CSS runs `sku start`
- **AND** a document response is streamed
- **THEN** the document includes a stylesheet link for the SSR-CSS virtual module
- **AND** `transformIndexHtml` is not invoked for that response

#### Scenario: Production CSS does not use the start-only virtual stylesheet

- **WHEN** an SSR app runs `sku build` / production
- **THEN** document CSS links come from the client manifest
- **AND** the start-only SSR-CSS virtual stylesheet is not required for those responses

### Requirement: SSR start emits page-load and HMR telemetry

On SSR `sku start`, sku MUST mount serve-only telemetry comparable to static Vite start, including Vite WS handlers for page-load and HMR timing.

Sku MUST deliver the page-load and HMR client scripts via the SSR browser client entry and/or `bootstrapModules` (not via `transformIndexHtml`, and not as new Document inline scripts solely for telemetry).

Sku MUST mark `initialPageLoad` when the SSR dev server is ready (parity with static start), and MUST emit `start.initial` and `start.rebuild` metrics with SSR-identifying tags (e.g. `type: 'ssr'`).

#### Scenario: Initial page-load telemetry on SSR start

- **WHEN** an SSR app runs `sku start` with tab open enabled
- **AND** the browser completes the initial document load with HMR connected
- **THEN** sku emits `start.initial` telemetry tagged for SSR

#### Scenario: HMR rebuild telemetry on SSR start

- **WHEN** an SSR app runs `sku start`
- **AND** an HMR update completes in the browser
- **THEN** sku emits `start.rebuild` telemetry tagged for SSR

#### Scenario: Telemetry clients are not injected via transformIndexHtml

- **WHEN** an SSR document response is generated during `sku start`
- **THEN** telemetry client scripts are not delivered through `transformIndexHtml`

### Requirement: waitForAll buffers until onAllReady

When a matched route sets `handle.waitForAll: true`, sku MUST wait for `onAllReady` before starting the HTML response body.

#### Scenario: waitForAll buffers until onAllReady

- **WHEN** a matched route has `handle.waitForAll: true`
- **THEN** sku pipes the HTML body only after `onAllReady`

### Requirement: Pre-commit render errors produce an ErrorBoundary document

A render error is a throw from the React tree during document SSR (a sync component throw, or a rejected Suspense tree).

This is distinct from a route error already recorded on the static handler context by `query()` (loaders / actions). Those remain the errored-route requirement below.

Commit is the point of no return: sku starts the HTML body (pipes the document).

When a render error occurs before commit, sku MUST still produce a streamed HTML document whose body is the nearest `ErrorBoundary` (or React Router’s default) and whose status is `500`, or the status of a route error response if the thrown value is one.

Sku MUST NOT hang waiting for `onAllReady` when a render error occurs while buffering for `waitForAll`.

Sku MUST attempt this recovery at most once per request. If recovery cannot produce a document, the render MUST fail and Express error handling MUST run.

Client abort / disconnect MUST NOT be treated as a render error and MUST NOT start recovery.

If abort occurs while the recovery pass is still running, sku MUST stop without hanging, MUST NOT complete that pass as a document, and MUST NOT report the abort through `onError` / `onShellError`.

Sku MAY report the original render error to `onError` / `onShellError` even when recovery succeeds.

#### Scenario: Sync throw before the shell is piped

- **WHEN** a matched route component throws during SSR before the HTML body is committed
- **THEN** the response is HTML with status 500
- **AND** the body is the nearest `ErrorBoundary`

#### Scenario: waitForAll Suspense rejection does not hang

- **WHEN** a matched route has `handle.waitForAll: true`
- **AND** a deferred tree rejects before `onAllReady`
- **THEN** sku does not wait forever for `onAllReady`
- **AND** the response is HTML with status 500
- **AND** the body is the nearest `ErrorBoundary`

#### Scenario: Recovery is once

- **WHEN** the ErrorBoundary pass also fails to produce a document
- **THEN** sku does not retry again
- **AND** the render fails to Express error handling

#### Scenario: Abort is not recovery

- **WHEN** the request is aborted while a `waitForAll` render is still buffering
- **THEN** sku does not render an ErrorBoundary document
- **AND** sku does not treat that abort as a render error for Express
- **AND** sku does not report the abort through `onError` / `onShellError`

#### Scenario: Abort during ErrorBoundary recovery

- **WHEN** sku has started the ErrorBoundary recovery pass
- **AND** the request is aborted before that pass produces a document
- **THEN** sku does not hang
- **AND** sku does not write an HTML document for that request
- **AND** sku does not treat that abort as a render error for Express
- **AND** sku does not report the abort through `onError` / `onShellError`

### Requirement: Client disconnect aborts document work

When the client disconnects, sku MUST stop document work for that request.

Client abort / disconnect MUST NOT be reported through `onError` / `onShellError`. Insert and pipeline failures after commit remain on the `onError` path below.

Dev and production MUST share this behaviour.

Disconnect after `render` has a document ready, including during header writes, MUST abort React and MUST NOT start the HTML body.

#### Scenario: Disconnect before headers

- **WHEN** the client disconnects before HTML headers are committed
- **THEN** sku aborts the stream and does not write the document body
- **AND** sku does not report the abort through `onError` / `onShellError`

#### Scenario: Disconnect during HTML header writes

- **WHEN** the document stream is already ready
- **AND** the client disconnects while sku is writing HTML headers
- **THEN** sku aborts the React stream
- **AND** sku does not pipe the HTML body
- **AND** sku does not call Express `next(error)` for that abort
- **AND** sku does not report the abort through `onError` / `onShellError`

#### Scenario: Disconnect during header writes

- **WHEN** the client disconnects while sku is writing HTML headers
- **THEN** sku aborts the React stream
- **AND** sku does not start the HTML body

#### Scenario: Disconnect before a short-circuit Response is written

- **WHEN** render resolves to a loader or action `Response` after the client has disconnected
- **THEN** sku does not write that response

#### Scenario: Disconnect while buffering waitForAll

- **WHEN** the client disconnects while sku is still waiting for `onAllReady`
- **THEN** sku aborts the render
- **AND** sku MUST NOT start an ErrorBoundary recovery pass for that cancellation

#### Scenario: Disconnect after piping starts

- **WHEN** the client disconnects after the HTML body has started piping
- **THEN** sku aborts the React stream
- **AND** sku does not report the abort through `onError` / `onShellError`

### Requirement: Render attempts settle once

Each `renderToPipeableStream` call is one attempt.
An attempt settles at most once by becoming ready to commit or by rejecting.

`render()` MUST honour the render `AbortSignal` before `query()` and before starting a document attempt.
When the signal is already aborted, or aborts before the document is ready to commit, `render()` MUST reject with the abort reason.
It MUST NOT run loaders or actions after the signal has aborted.
It MUST NOT hang unsettled after cancellation.

Cancellation MUST NOT trigger the ErrorBoundary recovery pass.

A failed ErrorBoundary recovery setup MUST reject `render()`.
It MUST NOT leave the render promise hanging.

#### Scenario: Already-aborted signal rejects promptly

- **WHEN** render starts with an already-aborted signal
- **THEN** the render promise rejects with the abort reason
- **AND** sku does not run loaders or actions for that request
- **AND** sku does not resolve a document ready to commit

#### Scenario: Abort during pending waitForAll does not retry

- **WHEN** a `waitForAll` render is still pending
- **AND** the render signal aborts
- **THEN** the render promise rejects with the abort reason
- **AND** sku does not render an ErrorBoundary recovery pass for that abort

#### Scenario: Recovery setup failure rejects

- **WHEN** the first document attempt fails with a recoverable render error
- **AND** sku cannot build an ErrorBoundary recovery context
- **THEN** the render promise rejects with that error
- **AND** sku does not leave the render promise hanging

### Requirement: Uncommitted document renders have a deadline

Sku MUST abort a document render that stays uncommitted past a sku-owned deadline.

That timeout is not a client disconnect.
When the client is still connected, the rejection MUST reach Express error handling.

The same deadline MUST abort remaining React work after the body has started so a hung Suspense boundary cannot hold the socket open.

Timeout MUST NOT start an ErrorBoundary recovery pass.

#### Scenario: waitForAll exceeds the deadline

- **WHEN** a `waitForAll` render is still waiting for `onAllReady`
- **AND** the sku-owned deadline elapses
- **THEN** the render promise rejects
- **AND** sku does not render an ErrorBoundary recovery pass for that timeout
- **AND** sku passes the error to Express error handling while the client is connected

#### Scenario: Deadline after piping starts

- **WHEN** the HTML body has started piping
- **AND** the sku-owned deadline elapses
- **THEN** sku aborts the React stream

### Requirement: Cancellation is not an Express render error

When HTML middleware cancels because the client disconnected, sku MUST NOT forward that cancellation through Express error handling.

Genuine render failures on a still-connected request MUST still reach Express error handling.

#### Scenario: Disconnect suppresses cancel rejection

- **WHEN** render rejects because the client disconnected
- **THEN** sku does not call the render-error hook
- **AND** sku does not pass the error to Express `next`
- **AND** sku does not report the abort through `onError` / `onShellError`

#### Scenario: Connected render failure reaches Express

- **WHEN** render rejects while the client is still connected
- **THEN** sku invokes the render-error hook when configured
- **AND** sku passes the error to Express `next`

### Requirement: Post-commit pipe failures abort React

After the HTML body is committed, sku MUST NOT start a second document.

When the insert-html transform or the response pipe fails after commit, sku MUST abort the React stream and MUST error the destination.

Partial HTML on a live connection is inherent to streaming.

#### Scenario: Insert callback throw after shell

- **WHEN** an `insertHtml` callback throws after the shell is ready
- **THEN** sku aborts the React stream
- **AND** the HTML destination is errored
- **AND** sku does not start a second HTML document

### Requirement: Loader and action Responses are forwarded

When React Router returns a `Response` from `query` (for example a redirect), sku MUST forward that response instead of streaming HTML.

If the client disconnects while that `Response` is being read, sku MUST NOT write it.

When the request abort signal is already aborted before `query()`, sku MUST NOT run route loaders or actions.

#### Scenario: Loader redirect Response

- **WHEN** a loader returns a redirect `Response`
- **THEN** sku forwards that status/headers/body and does not stream HTML

#### Scenario: Disconnect while reading a short-circuit Response

- **WHEN** `query` returns a `Response`
- **AND** the client disconnects before that body is written
- **THEN** sku does not write that `Response` to the client
- **AND** sku does not call Express `next(error)` for that abort

#### Scenario: Already-aborted signal skips actions

- **WHEN** the request is already aborted before render
- **THEN** route actions do not run
- **AND** sku does not stream HTML

### Requirement: Document responses forward loader and action headers

On streamed HTML (not a short-circuit `Response`), sku MUST forward `loaderHeaders` / `actionHeaders` (including `Set-Cookie`) plus sku-owned headers such as `Content-Type` and CSP.

#### Scenario: Loader Set-Cookie on HTML response

- **WHEN** a loader contributes `Set-Cookie` and sku streams HTML
- **THEN** those headers are present alongside document `Content-Type` and CSP

### Requirement: Errored routes use the static handler status code

When React Router records a route error on the static handler context during `query()` (loader / action), sku MUST use `context.statusCode` and the nearest `ErrorBoundary` (or React Router’s default) on the first render pass.

Throws during `renderToPipeableStream` are the pre-commit render-error requirement above, not this one.

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
- **AND** SSR and hydrate `SkuProvider` both receive `undefined` (not `null`)

### Requirement: Server-entry onListen runs after successful listen

When the server entry includes optional `onListen`, sku MUST call it once after middleware + HTML pipeline are mounted **and** `listen` has succeeded — in both `sku start` and production.

```ts
onListen?: (args: {
  app: Express;
  httpServer: http.Server | https.Server;
  port: number;
}) => void | Promise<void>;
```

Sku MUST pass `{ app, httpServer, port }` where `port` is the bound listen port.

If `onListen` returns a promise, sku MUST await it.
If the callback throws or the promise rejects, startup MUST fail.

Sku MUST call `onListen` **once** (not on every server-entry HMR reload in start).

Sku MUST NOT provide an `onBeforeListen` hook.
Sku MUST NOT add sku-owned listen logging by default (apps MAY log in `onListen`).

Omitting `onListen` MUST NOT be an error.

#### Scenario: onListen receives app, httpServer, and bound port

- **WHEN** the server entry includes `onListen`
- **AND** the server has successfully listened
- **THEN** sku invokes `onListen` once with `{ app, httpServer, port }`
- **AND** `port` is the bound listen port

#### Scenario: onListen failure fails startup

- **WHEN** `onListen` throws or returns a rejected promise
- **THEN** startup fails

#### Scenario: onListen is not re-invoked on server-entry HMR

- **WHEN** `sku start` reloads the server entry via HMR after the initial successful listen
- **THEN** sku does not call `onListen` again for that process

### Requirement: expressTrustProxy opts into Express trust proxy hop count 1

SSR MUST support optional config `expressTrustProxy` as a boolean.

When `expressTrustProxy` is `true`, sku MUST set `app.set('trust proxy', 1)` (hop count `1`, not Express boolean `true`).

When `expressTrustProxy` is omitted or `false`, sku MUST leave Express’s default (`false`) — it MUST NOT enable trust proxy magically.

`expressTrustProxy` MUST NOT be a silent sku default; it is opt-in via config.

The create `ssr` template MUST set `expressTrustProxy: true` in `sku.config`.

Apps that need any other trust-proxy value (`false`, `2`, IP list, etc.) MUST override in `onListen` via `app.set('trust proxy', …)`.

#### Scenario: expressTrustProxy true sets hop count 1

- **WHEN** an SSR app sets `expressTrustProxy: true`
- **AND** the Express app is created for start or production
- **THEN** `app.get('trust proxy')` is `1`

#### Scenario: omitted expressTrustProxy leaves Express default

- **WHEN** an SSR app omits `expressTrustProxy` (or sets `false`)
- **THEN** sku does not enable trust proxy
- **AND** Express keeps its default (`false`)

#### Scenario: Create template opts into expressTrustProxy

- **WHEN** a user scaffolds with the `ssr` create template
- **THEN** the generated `sku.config` sets `expressTrustProxy: true`

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

SSR MUST support lazy route modules as separate async chunks.

#### Scenario: Distinct lazy route chunks

- **WHEN** an SSR app defines two or more lazy route modules
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

### Requirement: SSR Document preloads use route moduleIds only

Production SSR Document CSS and `modulepreload` links MUST come from matched-route `handle.moduleId` values (and optional vocab language chunks) resolved against the Vite client manifest.

SSR MUST NOT register Document preloads from `@sku-lib/vite/loadable` (Collector / `LoadableProvider` / `preloadPlugin` module-id injection).

That loadable path remains for static Vite / prerender only.

#### Scenario: Route moduleId drives Document assets

- **WHEN** a matched SSR route has `handle.moduleId` present in the client manifest
- **THEN** production Document assets include that chunk’s CSS and/or modulepreload as applicable

#### Scenario: Loadable does not feed SSR Document preloads

- **WHEN** an SSR app renders a `@sku-lib/vite/loadable` component whose module id is registered only via the loadable collector
- **THEN** sku does not add Document CSS or modulepreload links for that module id from the collector path

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

### Requirement: SSR publicPath is relative only and is the static asset prefix only

SSR apps MUST use a relative `publicPath`.

Absolute `http(s)` / CDN `publicPath` MUST fail at config validation.

`publicPath` MUST configure the static asset prefix only (webpack-aligned `__SKU_PUBLIC_PATH__`).

For `sku build` / production, Vite `config.base` is an implementation detail and MUST be set to that prefix so emitted client URLs match.

Production Document asset URLs MUST come from the baked server-local Vite client manifest (see the production build layout requirement).

In production, when a sibling `client/` directory exists next to `server/`, sku MUST mount `express.static` for `publicPath` **before** server-entry `middleware`, so existing client assets are served even when that middleware would otherwise handle (or return for) the same path.

When no sibling `client/` directory exists, sku MUST NOT mount `express.static` for that prefix and MUST NOT fail solely because the directory is absent.

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

#### Scenario: Production static assets before server-entry middleware when client exists

- **WHEN** an SSR production server has a sibling `client/` directory
- **AND** server-entry `middleware` that handles every request without calling `next`
- **AND** a client asset exists under `publicPath`
- **THEN** that asset is still served from the static mount
- **AND** the middleware does not handle that asset request

#### Scenario: Missing sibling client does not fail startup

- **WHEN** an SSR production server runs without a sibling `client/` directory
- **AND** the baked server-local manifest is present
- **THEN** the process starts successfully
- **AND** sku does not mount `express.static` for `publicPath`

#### Scenario: sku start serves Vite bootstrap from root

- **WHEN** an SSR app sets a relative `publicPath` such as `/static/my-app` and runs `sku start`
- **THEN** the document references bootstrap modules under `/` (e.g. `/@vite/client`)
- **AND** those URLs are served as JavaScript by Vite (not HTML / React Router 404 fallthrough)
- **AND** the document does not require assets under that `publicPath` for hydration

### Requirement: SSR rejects the public assets folder

SSR MUST NOT support config `public` (the folder of files copied/served as-is without content hashing).

Config always includes a `public` path (default `'public'`).

The rejection signal is that `paths.public` exists on disk — not merely that the option is set.

When that directory exists, `sku start` and `sku build` MUST hard-error and guide consumers to import assets from modules instead.

SSR MUST NOT set Vite `publicDir` to that folder and MUST NOT copy public files into the build output.

Static Vite and webpack apps MAY keep existing `public` behaviour.

#### Scenario: Existing public directory rejected for SSR

- **WHEN** SSR is enabled and the configured `public` directory exists on disk
- **THEN** `sku start` / `sku build` fail with a hard error
- **AND** the error advises importing assets from scripts/modules instead of using the public assets folder

#### Scenario: SSR does not copy or serve publicDir assets

- **WHEN** an SSR app runs without an existing `public` directory
- **THEN** sku does not enable Vite `publicDir` for that folder
- **AND** does not copy public assets into the client build output

### Requirement: SSR rejects dangerouslySetViteConfig

SSR MUST NOT support `dangerouslySetViteConfig`.

Sku opens escape hatches only for known best-practice needs.

When that option is set, config validation MUST hard-error and point consumers to sku-support channels with their use-case.

Sku MUST NOT apply the `dangerouslySetViteConfig` decorator plugin on the SSR plugin graph.

Static Vite MAY keep existing `dangerouslySetViteConfig` behaviour.

Product / Migrating / `configuration.md` docs MUST state that the option is unsupported for SSR and that exceptional Vite customisation needs should go through support first.

#### Scenario: dangerouslySetViteConfig rejected for SSR

- **WHEN** an SSR app sets `dangerouslySetViteConfig`
- **THEN** config validation fails
- **AND** the error points consumers to sku-support channels

#### Scenario: Docs state dangerouslySetViteConfig unsupported for SSR

- **WHEN** a reader opens SSR product, Migrating, or `configuration.md` docs for `dangerouslySetViteConfig`
- **THEN** docs state that SSR does not support the option
- **AND** docs direct exceptional Vite customisation use-cases to sku-support

### Requirement: SSR rejects vitePlugins

SSR MUST NOT support `vitePlugins`.

Sku opens escape hatches only for known best-practice needs.

When that option is set, config validation MUST hard-error and point consumers to sku-support channels with their use-case.

Sku MUST NOT mount consumer `vitePlugins` on the SSR plugin graph.

Static Vite MAY keep existing `vitePlugins` behaviour.

Product / Migrating / `configuration.md` docs MUST state that the option is unsupported for SSR and that exceptional Vite customisation needs should go through support first.

#### Scenario: vitePlugins rejected for SSR

- **WHEN** an SSR app sets `vitePlugins`
- **THEN** config validation fails
- **AND** the error points consumers to sku-support channels

#### Scenario: Docs state vitePlugins unsupported for SSR

- **WHEN** a reader opens SSR product, Migrating, or `configuration.md` docs for `vitePlugins`
- **THEN** docs state that SSR does not support the option
- **AND** docs direct exceptional Vite customisation use-cases to sku-support

### Requirement: SSR uses a single port

SSR MUST use config `port` for `sku start` and as the baked production default listen port (`__SKU_DEFAULT_SERVER_PORT__`).

`process.env.PORT` MUST still override the baked default at runtime.

Providing `serverPort` with SSR MUST fail config validation (`serverPort` remains webpack-SSR-only).

SSR config types MUST NOT accept `serverPort`.

#### Scenario: port bakes the production default listen port

- **WHEN** an SSR app sets `port` and runs `sku build`
- **THEN** the production server’s baked default listen port is that `port` value
- **AND** `process.env.PORT` still overrides it when set

#### Scenario: serverPort is rejected for SSR

- **WHEN** an SSR app sets `serverPort`
- **THEN** config validation fails stating that SSR uses `port` only

### Requirement: httpsDevServer works for SSR development

When `httpsDevServer` is enabled, SSR `sku start` MUST serve over HTTPS with working HMR.

Production remains HTTP.

#### Scenario: httpsDevServer start

- **WHEN** `httpsDevServer: true` and the user runs `sku start`
- **THEN** document responses succeed over HTTPS
- **AND** local URLs use `https://`

### Requirement: Teams can scaffold an SSR app via create

`@sku-lib/create` MUST offer a template with id `ssr`.

#### Scenario: Create ssr template

- **WHEN** a user runs `@sku-lib/create --template ssr`
- **THEN** the project is SSR with `expressTrustProxy: true` and `routesEntry` exporting named `routes`
- **AND** config `sites` may be omitted or declare real site names
- **AND** the server entry exports `middleware` (and may export `onListen` / context getters)
- **AND** the client entry exports `onHydrate` (and may export context getters)
- **AND** the template wires `createSkuContexts` in `src/skuContext.ts` and has no `Providers` export
- **AND** the template has `src/RootLayout.tsx` and no `src/App/` directory
- **AND** the home page calls `useSite()` (and does not use `import.meta.env` for site/environment demo)
- **AND** a 0–1 site template omits `getSite`
- **AND** a 0–1 site template keeps unparameterized `SkuRouteObject[]`
- **AND** request entries do not re-export `routes`
- **AND** lazy page modules export named `Component`
- **AND** can `sku start` without further entry setup

#### Scenario: Create template is ssr

- **WHEN** a user scaffolds an SSR app with `@sku-lib/create`
- **THEN** the template id is `ssr`

#### Scenario: Static vite create template unchanged

- **WHEN** a user creates a project with the existing `vite` template
- **THEN** it is not configured as `buildType: 'ssr'` by default

### Requirement: CJS default-export interop is documented

SSR product / Migrating docs MUST explain that some CommonJS packages resolve to a module namespace object under `sku start` SSR (React “Element type is invalid … got: object”), that production build may still succeed, and that consumers extend `__UNSAFE_EXPERIMENTAL__cjsInteropDependencies`.

Sku MUST NOT expand baked-in interop defaults beyond existing Apollo behaviour for this change.

Sku MUST NOT rewrite or wrap React render errors at runtime for this case — documentation is sufficient.

#### Scenario: Docs cover CJS interop for SSR start

- **WHEN** a reader opens SSR product or Migrating docs
- **THEN** docs describe the start-vs-build CJS interop failure mode
- **AND** document `__UNSAFE_EXPERIMENTAL__cjsInteropDependencies` with common open-source offender examples

### Requirement: Config types describe SSR accurately

`SkuConfig` bundler JSDoc (and generated config docs derived from it) MUST NOT claim that `vite` is only supported for static apps while `buildType: 'ssr'` exists.

#### Scenario: Bundler JSDoc allows SSR

- **WHEN** a reader inspects `bundler` JSDoc on `SkuConfig`
- **THEN** it reflects that Vite supports static and experimental SSR via `buildType`

### Requirement: SSR uses shared Express 4 with aligned typing

The SSR server runtime MUST use the same Express major as sku’s other Express-based servers (webpack SSR / `sku serve`).

That major MUST remain Express 4 for this change.

Sku MUST NOT upgrade `express` / `@types/express` from 4 → 5 as part of SSR.

Migrating / product docs MUST state that consumers should target Express 4 when typing `middleware` / `SkuMiddleware`.

#### Scenario: Runtime and types use Express 4

- **WHEN** an SSR app runs `sku start` or the production server
- **THEN** sku’s server depends on Express 4
- **AND** published Express typings used for SSR middleware align with Express 4
- **AND** webpack SSR continues to use the same Express 4 major

#### Scenario: Docs state Express 4

- **WHEN** a reader opens SSR middleware or Migrating docs
- **THEN** docs state that Express 4 is the supported major for middleware typing
- **AND** docs do not require Express 5 for SSR

### Requirement: Express and React Router major upgrades may be breaking

Product docs and release notes for SSR MUST state that bumping the Express or React Router major integrated by SSR may be a breaking change.

Consumer `middleware` / `devServerMiddleware` mount into sku’s Express app, and consumer routes/entries use React Router Data Mode APIs.

This change MUST NOT itself bump Express; an Express 4 → 5 upgrade remains a deferred sku-wide breaking change.

#### Scenario: Docs warn major upgrades may break

- **WHEN** a reader opens SSR product docs covering middleware or React Router / routes
- **THEN** docs state that Express and React Router major upgrades may be breaking for SSR consumers

### Requirement: SSR first release is documented as experimental

The first release MUST be documented as experimental (testing only; not for production) in product docs and the changeset.

Sku MUST NOT add a runtime experimental gate.

#### Scenario: Docs warn experimental

- **WHEN** a reader opens SSR product docs
- **THEN** an experimental / not-for-production warning is present near the start
- **AND** the changeset states the same

### Requirement: Product docs cover core SSR topics

SSR product docs MUST describe Managed Data Mode vs SSR and the core app contract:

- `routesEntry` + `routes` with optional `sites` membership
- `SkuRouteObject<SiteOf<typeof server>>` for multi-site `sites` typing (same `Site` as `useSite`)
- optional `mapRoutePath` for per-site multi-path pages, including index homes via `path: ''` (and correct preload-safe examples)
- case-sensitive path matching by default (`caseSensitive: true` when omitted) and per-route `caseSensitive: false` opt-out
- `getSite` tree selection (required when config has >1 site; sole resolved site — soft-default `'default'` when config `sites` is empty — when omitted on 0–1 site)
- default-exported request entries via `defineServerEntry` / `defineClientEntry<typeof server>` with optional getters and sibling projection
- always-on `SkuProvider` + `createSkuContexts<typeof server, typeof client>()` in `src/skuContext.ts`
- optional `middleware` / `onListen` / `onHydrate` / dual-entry `instrumentations` and config `expressTrustProxy`
- the three value channels vs the app-owned root layout route
- middleware layers (production: request-context → optional `express.static(publicPath)` when sibling `client/` exists → server-entry `middleware` → HTML, plus the existing `sku start` order)
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
- **THEN** docs cover `routesEntry`, `SkuProvider` / `createSkuContexts` in `src/skuContext.ts`, the three value channels, the app-owned root layout route, named `routes`, optional `sites`, `SkuRouteObject<SiteOf<typeof server>>`, optional `mapRoutePath`, case-sensitive path matching by default with per-route opt-out, `getSite`, `defineServerEntry` / `defineClientEntry<typeof server>`, optional `middleware` / `onListen` / `onHydrate` / `instrumentations`, `expressTrustProxy`, CSP, and response headers
- **AND** docs steer page content toward render-time data loading with clients from `useReactContext` / `useClientContext` (not loaders as the default)
- **AND** docs describe loaders as opt-in for deeply-nested waterfalls, document redirects, response headers, or opt-in `getRouterContext`
- **AND** docs document optional dual-entry `getRouterContext` and Data Mode vs Framework Mode seeding
- **AND** docs document optional dual-entry `instrumentations` and the server route-only vs client router+route split
- **AND** docs link to React Router’s instrumentation guide
- **AND** docs show how to type middleware-appended Express `req` fields via `express-serve-static-core` module augmentation
- **AND** docs include a red warning against putting Express `req` into `RouterContextProvider`
- **AND** docs include a client-navigation example where context works for a non-initial location without Express
- **AND** docs show a complete Apollo streaming setup with `useInsertHtml`, `getReactContext` + root-layout provider, the nonce on injected scripts via `getCspNonce` from `sku/runtime`, and why loader-transported query refs are unsupported

#### Scenario: Docs discourage public assets folder for SSR

- **WHEN** a reader opens SSR product or Migrating docs (and `configuration.md` for `public`)
- **THEN** docs state that SSR does not support the public assets folder
- **AND** recommend importing assets from modules instead
- **AND** Migrating notes that existing `public` folder usage must be moved off before adopting SSR

#### Scenario: Docs discourage dangerouslySetViteConfig for SSR

- **WHEN** a reader opens SSR product or Migrating docs (and `configuration.md` for `dangerouslySetViteConfig`)
- **THEN** docs state that SSR does not support `dangerouslySetViteConfig`
- **AND** docs direct exceptional Vite customisation use-cases to sku-support

#### Scenario: Docs discourage vitePlugins for SSR

- **WHEN** a reader opens SSR product or Migrating docs (and `configuration.md` for `vitePlugins`)
- **THEN** docs state that SSR does not support `vitePlugins`
- **AND** docs direct exceptional Vite customisation use-cases to sku-support

### Requirement: Deploy-to-production docs cover SSR runtime layout

Deploy-to-production docs MUST cover:

- production entry `node dist/server/server.js` and sibling build `client/` + `server/` layout
- that Document asset URLs come from a baked server-local Vite client manifest (server starts without sibling `client/`)
- that productionised services SHOULD host hashed `client/` assets via reverse proxy or persistent storage, not from the Node process
- that shipping sibling `client/` so Node can `express.static` them is standalone / experimentation only
- that the production Node deploy MUST include runtime `node_modules` (or an equivalent production install) alongside `server/`
- relative `publicPath` only (no absolute / CDN asset base)

#### Scenario: Deploy docs cover runtime package and asset hosting

- **WHEN** a reader opens SSR deploy-to-production docs
- **THEN** docs state the production Node deploy needs `server/` plus runtime `node_modules` (or equivalent)
- **AND** docs recommend reverse proxy / persistent storage for hashed `client/` assets
- **AND** docs describe sibling `client/` + Node `express.static` as standalone / experimentation only
- **AND** docs state the server starts without sibling `client/` once the baked manifest is present

### Requirement: Migrating docs cover Static and Webpack SSR adoption

SSR MUST include Migrating docs for Static App and Older / Webpack SSR App.

Migrating docs MUST cover:

- named `Component` (not default export) for lazy routes
- `routesEntry` + `routes` + optional `sites` + `getSite` (required when config has >1 site; fail closed on unknown / non-string site; sole resolved site — soft-default `'default'` when config `sites` is empty — when omitted on 0–1 site)
- `SkuRouteObject<SiteOf<typeof server>>` for multi-site `sites` typing
- optional `mapRoutePath` for per-site multi-path pages
- case-sensitive path matching by default and per-route `caseSensitive: false` opt-out
- default-exported request-entry objects via `defineServerEntry` / `defineClientEntry<typeof server>` instead of an `onRequest` value return bag; optional `middleware` / `onListen` / `onHydrate` / `instrumentations`
- webpack `onStart` → server-entry `onListen({ app, httpServer, port })`; trust proxy via config `expressTrustProxy` (not `onStart`); other trust-proxy values via `onListen`
- multi-site membership via `sites` on routes
- webpack dual-port (`port` + `serverPort`) vs SSR single `port` (`serverPort` rejected; production still honours `PORT`)
- production entry path `node dist/server/server.js` and sibling `client/` + `server/` layout
- that Document assets resolve from a baked server-local manifest (no sibling `client/` required to start)
- that productionised deploys host `client/` via reverse proxy / persistent storage; Node `express.static` of sibling `client/` is standalone / experimentation only
- that production Node deploys must include runtime `node_modules` (or equivalent) with `server/`
- that when Node static is mounted, it serves under `publicPath` **before** server-entry `middleware`
- CJS interop for `sku start`
- Express 4 typing alignment (shared with webpack SSR; no Express 5 in this change)
- React Router 8 as optional peerDependency for Data Mode / route typing (create template installs it)
- that Express / React Router major upgrades may be breaking (middleware + Data Mode integration)
- that this change does not ship Jest transforms for React Router 8
- moving off config `public` / the public assets folder (import assets in modules instead; pattern discouraged)
- that `dangerouslySetViteConfig` and `vitePlugins` are unsupported for SSR (hard-error when set; raise use-cases via sku-support)
- keeping server-only loader modules out of the client-imported route graph (split trees; set `handle.moduleId` when lazy factories are non-idiomatic)
- prefer render-time React data loading via Suspense with clients from `useReactContext` / `useClientContext`; use loaders for avoiding heavily-nested waterfalls, document redirects, response headers, or opt-in `getRouterContext` — not as the default for page content
- Apollo streaming hydration end to end: an app-owned transport over `useInsertHtml`, dual-entry `getReactContext` for `makeClient` / server nonce `extraScriptProps` via `getCspNonce` from `sku/runtime`, isomorphic provider in the root layout via `useReactContext()`, and that Apollo apps must drop two-pass `getDataFromTree`
- that loader-transported query refs (`@apollo/client-integration-react-router`'s `apolloLoader` / `preloadQuery`) are not supported, because sku's hydration bootstrap is JSON and promise-scrubbed
- that loader `request` stays Fetch; Express `req` is available where designed on getters / server `getRouterContext`, not as the loader `request` argument
- that early getters do not receive Fetch `Request` or `res`, and MUST stay synchronous / pure (libs may memoise on `req`); later getters receive sibling values
- optional dual-entry `getRouterContext` (Data Mode vs Framework Mode; server seeds from middleware bag + Fetch `request` + siblings; client seeds from browser-visible state + siblings; same `createContext` keys; different construction; cadence: once per document `query` vs every client nav/fetcher)
- how to type Express `req` fields appended by middleware (module augmentation of `express-serve-static-core` `Request`, shared by `middleware` / getters / server `getRouterContext`; same pattern as sku’s `getCspNonce` from `sku/runtime`)
- relation of Express `middleware` vs RR route `middleware` vs entry `getRouterContext`, and of `getClientContext` / `getReactContext` / `SkuProvider` hooks vs the app’s root layout route vs `getRouterContext` (loader/action context)
- that wrapping which needs React Router hooks or loader data belongs in the app’s own root layout route in `routesEntry`
- a **red warning** that apps MUST NOT put Express `req` (or other non-isomorphic platform objects) into `RouterContextProvider` — project values both sides can supply
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
- **THEN** docs explain webpack dual-port → SSR single `port` (drop `serverPort`; `PORT` still overrides production)
- **AND** docs state the production server entry is `dist/server/server.js` with sibling `client/` and `server/` build outputs
- **AND** docs state Document assets resolve from a baked server-local manifest
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
