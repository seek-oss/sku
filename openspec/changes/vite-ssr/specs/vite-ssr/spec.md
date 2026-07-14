## ADDED Requirements

### Requirement: Vite SSR mode is selected via renderType config

Vite SSR apps MUST be enabled by setting `renderType` to `server-side-rendered` in sku config (with the Vite bundler), not by invoking `sku start-ssr` or `sku build-ssr`.

#### Scenario: renderType enables Vite SSR

- **WHEN** sku config sets `bundler: 'vite'` and `renderType: 'server-side-rendered'`
- **AND** a Vite SSR routes entry is provided
- **THEN** sku treats the project as a Vite SSR app for `sku start` and `sku build`

#### Scenario: static-generated remains static

- **WHEN** sku config sets `renderType: 'static-generated'` (or omits `renderType` with today’s static default)
- **THEN** sku does not treat the project as a Vite SSR app

### Requirement: Webpack is rejected for the new server-side-rendered mode

`renderType: 'server-side-rendered'` MUST only be valid with the Vite bundler. Webpack MUST NOT implement this mode.

#### Scenario: webpack plus server-side-rendered errors

- **WHEN** sku config sets `bundler: 'webpack'` (or the webpack default) and `renderType: 'server-side-rendered'`
- **THEN** sku fails with an error stating that `server-side-rendered` is not supported with webpack

### Requirement: Suffixed SSR commands error when renderType is set

When `renderType` is set in sku config, consumers MUST use `sku start` and `sku build`. `sku start-ssr` and `sku build-ssr` MUST fail.

#### Scenario: start-ssr with renderType errors

- **WHEN** sku config sets `renderType` to `server-side-rendered` or `static-generated`
- **AND** the user runs `sku start-ssr`
- **THEN** the command fails
- **AND** the error states that `-ssr` commands are not used with `renderType` (use `sku start` instead)

#### Scenario: build-ssr with renderType errors

- **WHEN** sku config sets `renderType` to `server-side-rendered` or `static-generated`
- **AND** the user runs `sku build-ssr`
- **THEN** the command fails
- **AND** the error states that `-ssr` commands are not used with `renderType` (use `sku build` instead)

### Requirement: Vite SSR is configured via a routes entry

Vite SSR apps MUST declare routes through a routes entry configured via `routesEntry` (default `src/routes.tsx`) that exports a named `routes` value of type `RouteObject[]` (React Router Data Mode), rather than a low-level HTML `renderCallback`. Sku MUST NOT expose a `SkuApp` wrapper type. The routes entry MUST NOT export HTTP middleware.

#### Scenario: Routes entry is required for Vite SSR

- **WHEN** a project uses `renderType: 'server-side-rendered'` with Vite
- **THEN** they MUST provide a routes entry exporting named `routes`
- **AND** they MUST NOT need a webpack-style `serverEntry` `renderCallback` to render HTML responses
- **AND** HTTP middleware MUST NOT be declared on the routes entry

### Requirement: Required server and client request entries

Vite SSR MUST require separate consumer server and client request-entry modules configured via the existing `serverEntry` and `clientEntry` keys (defaults `src/server.tsx` / `src/client.tsx`). Sku MUST NOT introduce parallel `entryServer` / `entryClient` config keys for this purpose. Under Vite SSR these entries MUST NOT own the HTML response (sku still owns Document streaming and CSP); their Vite SSR contracts are the named exports below, not webpack `renderCallback` / static hydrate. Missing entry files MUST be a hard error — sku MUST NOT supply noop stubs for absent files.

Sku MUST consume **named exports only**. The following named exports MUST be present; missing any MUST be a hard error. Sku MUST NOT fall back to a module’s `default` export for these hooks, and MUST NOT soft-skip missing names:

- Routes entry (`routesEntry`): `routes`
- Server entry (`serverEntry`): `onRequest`, `middleware`
- Client entry (`clientEntry`): `onHydrate`

The server entry (`serverEntry`) MUST export:

- `onRequest` — invoked before React Router `query()`; MAY return only:
  - `AppWrapper` — a React component `ComponentType<{ children: ReactNode }>` for providers / request-scoped seed (**not** page layout). Sku MUST mount it **inside** the router as a pathless parent layout above the consumer `routes` so it MAY use React Router context/hooks (for example `useLocation`)
  - `language` — a configured language name (or `en-PSEUDO`) for vocab chunk identification
  - `clientContext` — a JSON-serialisable value serialised into the hydrate bootstrap at shell time
- `middleware` — a Connect-compatible `RequestHandler` or array of handlers, mounted before the HTML render path (empty array or passthrough is allowed)

The client entry (`clientEntry`) MUST export:

- `onHydrate` — receives `{ context, language }` where `context` is the deserialized `clientContext` and `language` is forwarded by sku from the server result, and MAY return only `AppWrapper`

Return-object fields on `onRequest` / `onHydrate` remain optional. Sku MUST render `Document` → router provider → optional sku pathless `AppWrapper` layout → consumer routes on server and client. When `AppWrapper` is omitted, sku MUST use the consumer `routes` without an injected parent.

#### Scenario: Server entry wraps routes inside the router and sets language

- **WHEN** a Vite SSR app’s named `onRequest` export returns `AppWrapper` and `language`
- **THEN** sku invokes that export before `query()`
- **AND** sku mounts `AppWrapper` as a pathless parent layout under `StaticRouterProvider` above the consumer routes (not outside the router provider)
- **AND** sku uses `language` for vocab chunk identification (when `languages` is configured)

#### Scenario: Client entry receives shell context and language

- **WHEN** a Vite SSR app’s server `onRequest` returns `clientContext` and `language`
- **THEN** sku serialises `clientContext` into the hydrate bootstrap
- **AND** sku invokes `onHydrate` with deserialized `context` and the same `language`
- **AND** when `onHydrate` returns `AppWrapper`, sku mounts it as a pathless parent layout under `RouterProvider` above the consumer routes
- **AND** that `AppWrapper` MAY use React Router hooks during render

#### Scenario: Missing request entry files hard-error

- **WHEN** a Vite SSR app omits the configured `serverEntry` or `clientEntry` file
- **THEN** sku fails with a hard error
- **AND** sku does not fall back to a noop stub for the missing entry

#### Scenario: Missing named exports hard-error

- **WHEN** a routes, server, or client entry module does not export the required named export (`routes`, `onRequest`, `middleware`, or `onHydrate`)
- **THEN** sku fails with a hard error stating which export is missing
- **AND** sku does not use the module’s `default` export as a substitute
- **AND** sku does not soft-skip the missing export

### Requirement: sku owns request routing using React Router

For Vite SSR apps, sku MUST match requests and render using React Router Data Mode based on the consumer `routes` export.

#### Scenario: Matched route renders

- **WHEN** a request URL matches a route in the routes entry route config
- **THEN** sku renders that route’s UI on the server and hydrates it on the client

#### Scenario: Unmatched route

- **WHEN** a request URL does not match any route
- **THEN** sku returns a not-found response according to the route config’s not-found handling (or sku’s default if none is provided)

### Requirement: Full-document streaming is the default render path

Vite SSR apps MUST stream a React-owned HTML document (`<html>`, `<head>`, and `<body>`) using Suspense-friendly server rendering by default, without requiring consumers to manage multi-part response helpers. Hydration MUST be at the document level (not a `#app` / `#root` partial shell).

#### Scenario: Deferred content streams after shell

- **WHEN** a route suspends on non-critical data after the shell is ready
- **THEN** sku sends the document shell first and streams the remaining HTML as it resolves

#### Scenario: Document-level hydration

- **WHEN** the client hydrates a Vite SSR response
- **THEN** hydration targets the document root
- **AND** MUST NOT use `getElementById('app')` or `getElementById('root')` as the hydration root for this mode
- **AND** a browser client successfully hydrates interactive UI from that response (not HTML-only assertion)

#### Scenario: No HTML template injection shell

- **WHEN** a Vite SSR document response is produced
- **THEN** the body is the React document stream
- **AND** the response is not assembled by splitting `index.html` (or equivalent) on an app placeholder

### Requirement: Streaming SSR responses do not use transformIndexHtml

Vite SSR document responses MUST NOT call Vite’s `transformIndexHtml` to produce or finalize the HTML body. Vite client, React Refresh preamble, CSS, and entry scripts MUST be supplied via Document assets, bootstrap APIs, and/or the client entry instead.

#### Scenario: Stream path skips HTML transform

- **WHEN** a Vite SSR document response is generated
- **THEN** the body is produced by piping the React render stream
- **AND** `transformIndexHtml` is not invoked for that response

#### Scenario: Dev HMR without preamble injection in HTML

- **WHEN** a Vite SSR app runs in development
- **THEN** React Refresh preamble is available via the client entry (or sku equivalent)
- **AND** HMR does not fail with a missing-preamble error caused by skipping `transformIndexHtml`

### Requirement: Per-route async chunks are supported

Vite SSR apps MUST support loading route modules as separate async chunks on server and client. This change MUST include a fixture that demonstrates per-route chunking with at least two lazy routes that resolve to distinct client chunks.

#### Scenario: Lazy route module

- **WHEN** a route is defined with a lazy/async module boundary
- **THEN** that route’s code is loaded as a separate chunk and participates in SSR and hydration

#### Scenario: Fixture demonstrates distinct route chunks

- **WHEN** the Vite SSR per-route chunking fixture is built (or exercised in e2e)
- **AND** it defines at least two lazy/async route modules
- **THEN** those routes resolve to distinct client chunks
- **AND** each matched route’s chunk participates in SSR and hydration for that route

### Requirement: Vocab language chunks are supported

When `languages` is configured, Vite SSR apps MUST support vocab/language async chunks: language translations MUST be split into language chunks at build time, and the active language chunk MUST be registered for Document assets on the SSR response path (parity with static Vite `@vocab/vite` chunk helpers).

Sku owns chunk **registration**. Language **identification** is app-owned **only** via the `language` field returned from server `onRequest` (configured language name, e.g. `th-TH` — not necessarily a URL path segment). When that field is unset, sku MAY fall back to the sole configured language when exactly one language is set. Missing or unknown language MUST soft-fail (skip vocab chunk registration; do not error the response). Sku MUST NOT identify language from Express `req.skuLanguage`, a `:language` route param, or route `handle.language`. Sku MUST NOT expose an `addLanguageChunk` callback on the public Vite SSR API. Loaders/actions MAY read the resolved language via `getSkuLanguage()` after `onRequest` has run.

#### Scenario: Active language chunk is registered

- **WHEN** a Vite SSR app has `languages` configured
- **AND** server `onRequest` returns a configured language name as `language`
- **THEN** sku registers that language’s vocab chunk for the document assets / preloads used by the streamed response
- **AND** the language chunk participates in client load for that response

#### Scenario: Server entry language is the app-owned identity path

- **WHEN** a Vite SSR app has `languages` configured
- **AND** server `onRequest` returns `language` set to a configured language name
- **THEN** sku registers that language’s vocab chunk for the response
- **AND** sku does not use a `:language` route param or middleware language slot for identification

#### Scenario: Sole-language fallback when onRequest omits language

- **WHEN** a Vite SSR app has exactly one language configured
- **AND** server `onRequest` does not return `language`
- **THEN** sku uses that sole configured language to register the vocab chunk

#### Scenario: Soft-fail when language cannot be resolved

- **WHEN** a Vite SSR app has multiple `languages` configured
- **AND** server `onRequest` does not return a known `language`
- **THEN** sku does not register a vocab language chunk
- **AND** the SSR response still succeeds

#### Scenario: Build splits vocab by language

- **WHEN** a Vite SSR app with `languages` configured is built
- **THEN** vocab translations are emitted as separate language chunks via `@vocab/vite` chunk splitting

### Requirement: Dev and production use unified Vite SSR commands

Vite SSR development and production builds MUST use `sku start` and `sku build` (not `start-ssr` / `build-ssr`).

#### Scenario: Production server artifact

- **WHEN** a consumer runs `sku build` for a Vite SSR app (`renderType: 'server-side-rendered'`)
- **THEN** sku produces a build target containing sibling `client/` and `server/` directories
- **AND** `client/` contains browser assets and the Vite client manifest
- **AND** `server/` contains a runnable Node server entry (and SSR bundle)
- **AND** neither directory is nested inside the other

#### Scenario: Existing webpack SSR remains available without the new renderType

- **WHEN** a project uses the webpack bundler without `renderType: 'server-side-rendered'`
- **THEN** `sku start-ssr` and `sku build-ssr` continue to work as today

### Requirement: Static apps are unchanged

Static (SSG) apps MUST continue to use their existing Vite/Webpack static rendering paths, including any `transformIndexHtml` usage on the static path.

#### Scenario: Static Vite app unaffected

- **WHEN** a Vite project is configured as a static app (`renderType: 'static-generated'` or omit `renderType` with today’s static default)
- **THEN** `sku start` and `sku build` continue to prerender static HTML as today

### Requirement: Hydration bootstrap payload is production-safe

Vite SSR MUST serialize React Router hydration data without throwing on deferred Promises and MUST NOT leak server stack traces to the client in production.

#### Scenario: Action and loader data with Promises

- **WHEN** loader or action data contains Promise values at serialize time
- **THEN** sku scrubs those Promises before writing bootstrap script content
- **AND** serialization does not throw solely because of those Promises

#### Scenario: Production route errors omit stacks

- **WHEN** a route error `Error` is serialized into the hydration bootstrap in production
- **THEN** the payload includes the error message (and RouteErrorResponse fields when applicable)
- **AND** MUST NOT include `Error.stack`

### Requirement: Client disconnect aborts render before write

Vite SSR MUST abort in-flight document rendering when the client disconnects, and MUST NOT set HTML response headers or pipe the body after the request has been aborted. Development and production HTML middleware MUST share this abort-before-write behavior.

#### Scenario: Disconnect before headers

- **WHEN** the client disconnects after render begins but before HTML headers are committed
- **THEN** sku aborts the React stream
- **AND** does not write the document response body for that request

### Requirement: Loader and action Responses are forwarded

When React Router Data Mode returns a `Response` from `query` (for example a redirect), sku MUST forward that response to the client instead of streaming an HTML document.

#### Scenario: Loader redirect Response

- **WHEN** a matched loader (or equivalent handler path) returns a redirect `Response`
- **THEN** sku sends that status and headers/body to the client
- **AND** does not pipe a document HTML stream for that request

### Requirement: Document responses forward loader and action headers

When streaming an HTML document (not a short-circuit `Response` from `query`), sku MUST forward React Router `loaderHeaders` and `actionHeaders` from the static handler context onto the HTTP response (including multi-value headers such as `Set-Cookie`), in addition to sku-owned headers such as `Content-Type` and CSP.

#### Scenario: Loader Set-Cookie on HTML response

- **WHEN** a matched loader contributes response headers (for example via `data(..., { headers })` with `Set-Cookie`)
- **AND** sku streams an HTML document for that request
- **THEN** those loader headers are present on the HTTP response
- **AND** sku still sets document `Content-Type` and CSP headers as configured

### Requirement: Errored routes use the static handler status code

When React Router records route errors on the static handler context, the streamed HTML response MUST use `context.statusCode` (for example `500` for an uncaught loader `Error`, or `405` when a mutation is submitted to a route without an `action`). The HTML body MUST be the nearest route `ErrorBoundary` (or React Router’s default error UI when none is defined). sku MUST NOT provide a separate error-page API; consumer docs MUST point to React Router’s ErrorBoundary guidance for customizing content.

#### Scenario: Loader throw yields non-success status

- **WHEN** a matched loader throws an `Error` that React Router captures on the static handler context
- **THEN** the HTML response status is the static handler `statusCode` (typically `500`)
- **AND** the document still streams (error UI / hydration payload as applicable)

#### Scenario: Method not allowed uses ErrorBoundary body

- **WHEN** a mutation request matches a route that has no `action`
- **THEN** React Router records a route error with status `405`
- **AND** the HTML response status is `405`
- **AND** the streamed body is the nearest `ErrorBoundary` (or React Router’s default error UI)

### Requirement: waitForAll buffers until onAllReady

When a matched route sets `handle.waitForAll: true`, sku MUST wait for `onAllReady` before starting the HTML response body (instead of piping on `onShellReady`).

#### Scenario: waitForAll route

- **WHEN** a matched route has `handle.waitForAll: true`
- **THEN** sku does not begin piping the HTML body on shell-ready alone
- **AND** pipes only after all ready content is available (`onAllReady`)

### Requirement: React 19 is required for Vite SSR

Vite SSR (`renderType: 'server-side-rendered'` with Vite) MUST document React 19 or newer as a prerequisite. Sku MUST NOT perform a dedicated runtime React major-version check when enabling Vite SSR.

#### Scenario: Docs state React 19 prerequisite

- **WHEN** a project enables Vite SSR
- **THEN** sku documentation states that React 19 or newer is required
- **AND** sku does not reject the config solely because the installed React major version is less than 19

### Requirement: Lazy-route moduleId is auto-derived for idiomatic lazy imports

For production modulepreloads, sku MUST auto-derive `handle.moduleId` from idiomatic route definitions `lazy: () => import('…')` (single string-literal dynamic import) during the Vite SSR transform. Consumers MAY still set `handle.moduleId` explicitly; an explicit value MUST take precedence. Non-idiomatic lazy shapes MUST be skipped (no guessed id). In development, a missing or unknown `moduleId` for a lazy route that expects preloads MUST produce a warning (not a silent no-op).

#### Scenario: Idiomatic lazy route gets modulepreload without manual moduleId

- **WHEN** a matched route uses `lazy: () => import('./pages/about')` (or equivalent single string-literal import) and does not set `handle.moduleId`
- **THEN** production document assets include a modulepreload for that route’s client chunk (via the derived manifest key)

#### Scenario: Explicit moduleId is preserved

- **WHEN** a lazy route already sets `handle.moduleId`
- **THEN** sku does not overwrite it

#### Scenario: Unknown or missing moduleId warns in development

- **WHEN** a lazy route’s effective `moduleId` is missing or not in the client manifest during development
- **THEN** sku emits a warning
- **AND** does not fail the render solely for that reason

### Requirement: Vite SSR publicPath is relative only

Vite SSR apps MUST use a relative `publicPath` for public assets. Absolute `http(s):` / CDN `publicPath` MUST NOT be supported for this mode.

#### Scenario: Absolute publicPath rejected

- **WHEN** a project enables Vite SSR (`bundler: 'vite'` and `renderType: 'server-side-rendered'`)
- **AND** `publicPath` is an absolute `http(s)` URL
- **THEN** sku fails with an error stating that Vite SSR requires a relative `publicPath`

### Requirement: httpsDevServer works for Vite SSR development

When `httpsDevServer` is enabled, Vite SSR `sku start` MUST serve the single-port development server over HTTPS with a self-signed certificate and keep HMR working. Advertised local URLs MUST use the `https` scheme. Production `node dist/server/server.js` is unaffected (HTTP).

#### Scenario: httpsDevServer start

- **WHEN** a Vite SSR app sets `httpsDevServer: true`
- **AND** the user runs `sku start`
- **THEN** the development server accepts HTTPS requests on the configured port
- **AND** document responses succeed over HTTPS
- **AND** printed local URLs use `https://`

### Requirement: Vite SSR middleware is server-entry middleware

Vite SSR MUST mount consumer middleware from the server entry’s named `middleware` export before the HTML render path. The export is required (empty array or passthrough is allowed). The routes entry MUST NOT declare middleware. Config `devServerMiddleware` MUST NOT be required for Vite SSR request middleware (that config remains for static Vite / webpack). Missing `middleware` MUST be a hard error.

#### Scenario: Server-entry middleware runs before HTML render

- **WHEN** a Vite SSR app exports named `middleware` from the server entry
- **THEN** that middleware handles matching requests before sku streams HTML
- **AND** consumers are not required to set config `devServerMiddleware` for that behavior
- **AND** middleware is not read from the routes entry

#### Scenario: Missing middleware export hard-error

- **WHEN** a Vite SSR server entry does not export named `middleware`
- **THEN** sku fails with a hard error
- **AND** sku does not soft-skip or substitute a noop middleware

### Requirement: Production server does not require listen logging

Vite SSR production (`node dist/server/server.js` or equivalent) MUST NOT be required to log successful listen / port advertisement. Dev `sku start` URL printing is unchanged. Whether sku later accepts a custom logger for setup behaviours (including listen-on-port) is deferred — see `design.md` Open Questions.

#### Scenario: Production start without listen log

- **WHEN** a Vite SSR production server starts and listens on its configured port
- **THEN** sku is not required to emit a listen / port console message
- **AND** webpack SSR’s `sku SSR server started on port` message is not a Vite SSR requirement

### Requirement: Teams can scaffold a Vite SSR app via @sku-lib/create

`@sku-lib/create` MUST offer a Vite SSR template (template id `vite-ssr`) that generates a new sku app configured for Vite SSR. The scaffold MUST include `bundler: 'vite'`, `renderType: 'server-side-rendered'`, a relative `publicPath`, and the required entry modules with named exports (`routes`, `onRequest`, `middleware`, `onHydrate`) at the default paths. The existing static `vite` and `webpack` templates MUST remain unchanged (static Vite MUST NOT become SSR by default).

#### Scenario: Create with vite-ssr template

- **WHEN** a user runs `@sku-lib/create` with `--template vite-ssr` (or selects the Vite SSR interactive choice)
- **THEN** the generated project is a Vite SSR app (`bundler: 'vite'`, `renderType: 'server-side-rendered'`)
- **AND** the project includes `src/routes.tsx`, `src/server.tsx`, and `src/client.tsx` (or equivalent defaults) with the required named exports
- **AND** `sku start` can serve the scaffolded app without further entry-file setup

#### Scenario: Static vite create template unchanged

- **WHEN** a user creates a project with the existing `vite` template
- **THEN** the project remains a static / SSG Vite app
- **AND** it is not configured as `renderType: 'server-side-rendered'` by default

### Requirement: Vite SSR product docs cover providers, middleware, CSP, and response headers

The Vite SSR section of `docs/docs/server-rendering.md` (outside any Migrating heading) MUST include distinct headers that document app-level providers (`AppWrapper`), middleware, CSP, and response headers (including Cache-Control and sku forwarding of loader/action headers). These topics MUST NOT exist only under Migrating.

#### Scenario: Primary Vite SSR docs have topic headers

- **WHEN** a reader opens the Vite SSR section of `server-rendering.md` (not under Migrating)
- **THEN** distinct headers cover AppWrapper/providers, middleware, CSP, and response headers (including Cache-Control / forwarded loader-action headers)

### Requirement: Migrating sections in server-rendering docs

Sku MUST publish migration guidance as a **Migrating** heading in `docs/docs/server-rendering.md` with two self-contained subsections:

- **Migrate from Static App** — migrating from static apps (webpack or Vite) to Vite SSR
- **Migrate from Older SSR App** — migrating from webpack SSR to Vite SSR

Sku MUST NOT place these Vite SSR migration guides under `docs/migration-guides/`. Each subsection MUST be readable top to bottom (duplication of shared prerequisites between the two subsections is allowed and preferred over forcing readers to jump). Each subsection MUST open with **requirements** (including React 19+) and **limitations** (sku migration surface only; infrastructure, deployments, and process sit outside scope).

Each subsection MUST include distinct headers that cover the sku migration surface, including at least: config and commands; routes and request entries; app-level providers (`AppWrapper`); middleware; CSP; response headers such as Cache-Control and forwarded loader/action headers; and the Document / hydration model. The guides MUST remain high-level — they MUST NOT attempt an exhaustive file-by-file inventory of every app-specific change. `vite.md` MAY link to these subsections.

#### Scenario: Static migration subsection exists

- **WHEN** a reader opens the Migrating section of `server-rendering.md`
- **THEN** there is a **Migrate from Static App** subsection covering static (webpack or Vite) → Vite SSR
- **AND** that subsection is readable without requiring the Older SSR App subsection

#### Scenario: Older SSR migration subsection exists

- **WHEN** a reader opens the Migrating section of `server-rendering.md`
- **THEN** there is a **Migrate from Older SSR App** subsection covering webpack SSR → Vite SSR
- **AND** that subsection is readable without requiring the Static App subsection

#### Scenario: Requirements, limitations, and topic headers are present

- **WHEN** a reader opens either Migrating subsection
- **THEN** requirements are stated near the start (including React 19 or newer)
- **AND** limitations are stated near the start (including that infrastructure, deployments, and process are out of scope)
- **AND** distinct headers cover CSP, response headers (including Cache-Control), AppWrapper/providers, and middleware
