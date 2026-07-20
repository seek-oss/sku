## ADDED Requirements

### Requirement: Vite SSR mode is selected via buildType

Vite SSR MUST be enabled with `bundler: 'vite'` and `buildType: 'ssr'`, using `sku start` / `sku build`.

Omitting `buildType` or using `static` MUST leave static / existing webpack-SSR behaviour unchanged.

#### Scenario: buildType enables Vite SSR

- **WHEN** config sets `bundler: 'vite'` and `buildType: 'ssr'`
- **AND** required server and client entries export named `routes`
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

### Requirement: Server and client entries both export routes

Both `serverEntry` and `clientEntry` MUST export named `routes` as `RouteObject[]` (empty array allowed; missing or non-array MUST hard-error).

Server and client trees MUST stay hydration-compatible; sku MUST NOT runtime-validate that match.

#### Scenario: Both entries export routes

- **WHEN** a Vite SSR app is started or built
- **THEN** sku uses server `routes` for document / `query` and client `routes` for hydrate

#### Scenario: Missing or non-array routes hard-error

- **WHEN** a server or client entry omits named `routes` or exports a non-array `routes` value
- **THEN** sku fails with a hard error naming the entry/export
- **AND** does not use `default` or soft-skip

### Requirement: Required server and client request exports

Server entry MUST export `onRequest` and `middleware`; client entry MUST export `onHydrate`.

Missing named exports MUST hard-error (no default fallback, no noops).

Sku MUST NOT specially gate on entry file existence; a missing file fails via normal module resolution.

`onRequest` MAY return `AppWrapper`, `language` (server Document vocab only), and `clientContext`.

`onHydrate` receives `{ context }` only and MAY return `AppWrapper`.

Sku MUST NOT forward `language` to the client.

When `AppWrapper` is returned, sku MUST mount it as a pathless parent under the router above that side’s `routes`.

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

Vite SSR MUST stream a React-owned HTML document.

Hydration MUST target the document root (not `#app` / `#root`).

Default pipe is `onShellReady`.

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

#### Scenario: Promises do not break serialization

- **WHEN** loader or action data contains Promises at serialize time
- **THEN** sku scrubs them and serialization does not throw solely because of them

#### Scenario: Production route errors omit stacks

- **WHEN** a route error is serialized into the hydration bootstrap in production
- **THEN** the payload MUST NOT include `Error.stack`

### Requirement: Server-entry middleware runs before HTML render

Sku MUST mount the server entry’s Express/Connect `middleware` before the HTML render path in start and production.

The export is required (empty array or passthrough allowed).

#### Scenario: Server-entry middleware before HTML

- **WHEN** the server entry exports `middleware`
- **THEN** it handles matching requests before sku streams HTML

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

### Requirement: Vocab language chunks are supported

When `languages` is configured for build-time vocab splitting, sku MUST register a vocab language chunk on the Document only when server `onRequest` returns `language`.

Language is optional: if omitted, sku MUST NOT register a language chunk.

Sku MUST NOT validate the returned language against config and MUST NOT default to a sole configured language.

Language MUST be server-local for Document registration only (no client forward, no `getSkuLanguage` / `__SKU_LANGUAGE__` / baked languages define).

When vocab / `languages` is active, sku MUST resolve `@vocab/vite` from sku’s install tree and MUST alias bare `@vocab/vite/runtime` (prefer the export file) onto that copy in the shared Vite `resolve.alias` (client and SSR).

Sku MUST NOT alias the `@vocab/vite` package root (breaks subpath imports such as `@vocab/vite/chunks`).

Consumers MUST NOT need a direct `@vocab/vite` dependency for those bare imports to resolve.

#### Scenario: Language chunk from onRequest

- **WHEN** `onRequest` returns `language`
- **THEN** sku registers that language’s vocab chunk on the Document
- **AND** does not pass `language` to `onHydrate` or request-context

#### Scenario: No language means no language chunk

- **WHEN** `onRequest` omits `language`
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

`@sku-lib/create` MUST offer a `vite-ssr` template with required config/exports and a shared `createRoutes` scaffold.

Lazy route page modules in the template MUST use the React Router Data Mode named `Component` export (not `export default`).

The static `vite` template MUST remain unchanged.

#### Scenario: Create vite-ssr template

- **WHEN** a user runs `@sku-lib/create --template vite-ssr`
- **THEN** the project is Vite SSR with dual `routes` / `createRoutes`
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

`server-rendering.md` MUST cover dual-entry `routes`, AppWrapper, middleware layers, CSP, and response headers, and MUST include Migrating subsections for Static App and Older SSR App (not under `docs/migration-guides/`).

Migrating docs MUST also cover:

- named `Component` (not default export) for lazy routes
- webpack dual-port (`port` + `serverPort`) vs Vite SSR single `port` (`serverPort` rejected; production still honours `PORT`)
- production entry path `node dist/server/server.js` and sibling `client/` + `server/` layout
- CJS interop for `sku start`
- Express 4 typing alignment (shared with webpack SSR; no Express 5 in this change)
- React Router 8 as optional peerDependency for Data Mode / route typing (template/fixtures install it)
- that Express / React Router major upgrades may be breaking (middleware + Data Mode integration)
- that this change does not ship Jest transforms for React Router 8
- moving off config `public` / the public assets folder (import assets in modules instead; pattern discouraged)
- keeping server-only loader modules out of the client-imported route graph (split trees; set `handle.moduleId` when lazy factories are non-idiomatic)
- prefer render-time React data loading via `AppWrapper` + Suspense / shared clients; use loaders for avoiding heavily-nested waterfalls, document redirects, or response headers — not as the default for page content
- that Express `req` / middleware-attached state is **not** bridged into React Router loaders
- for Braid apps: reset must run before any Braid-touching server module on `sku start` (start evaluation order can differ from production build)
- providers that touch `window` must not run in the Document SSR tree (prefer client-only wrappers or `onHydrate`-only providers)
- Jest → Vitest as a Vite SSR prerequisite (point at existing Vitest docs / `@sku-lib/codemod jest-to-vitest`)
- path aliases: bare `src/…` / webpack `baseUrl` → `#src/…` via `pathAliases` (point at existing migrate-root-resolution guidance)

Docs MUST NOT tell consumers to install `@vocab/vite` solely so `@vocab/vite/runtime` resolves (sku owns that pin via Vite alias).

#### Scenario: Primary Vite SSR docs have topic coverage

- **WHEN** a reader opens the Vite SSR section of `server-rendering.md`
- **THEN** docs cover AppWrapper, routes, middleware, CSP, and response headers
- **AND** docs steer page content toward render-time data loading via `AppWrapper` (not loaders as the default)
- **AND** docs describe loaders as opt-in for deeply-nested waterfalls, document redirects, or response headers
- **AND** docs state that Express request state is not bridged into loaders

#### Scenario: Migrating subsections exist

- **WHEN** a reader opens the Migrating section of `server-rendering.md`
- **THEN** there are self-contained **Migrate from Static App** and **Migrate from Older SSR App** subsections

#### Scenario: Migrating covers port model and deploy layout

- **WHEN** a reader opens **Migrate from Older SSR App**
- **THEN** docs explain webpack dual-port → Vite SSR single `port` (drop `serverPort`; `PORT` still overrides production)
- **AND** docs state the production server entry is `dist/server/server.js` with sibling `client/` and `server/` directories

#### Scenario: Docs discourage public assets folder for Vite SSR

- **WHEN** a reader opens Vite SSR product or Migrating docs (and `configuration.md` for `public`)
- **THEN** docs state that Vite SSR does not support the public assets folder
- **AND** recommend importing assets from modules instead
- **AND** Migrating notes that existing `public` folder usage must be moved off before adopting Vite SSR

#### Scenario: Migrating covers Older SSR adoption topics

- **WHEN** a reader opens **Migrate from Older SSR App**
- **THEN** docs remind readers to keep server-only loader modules off the client route graph
- **AND** docs steer away from Express `req` → loader coupling for page content
- **AND** docs note Braid reset-before-Braid on `sku start` for Braid apps
- **AND** docs note that `window`-touching providers must not run in the SSR tree
- **AND** docs treat Jest → Vitest as a Vite SSR prerequisite and point at existing Vitest guidance
- **AND** docs do not require a direct `@vocab/vite` dependency solely for `@vocab/vite/runtime` resolve
- **AND** docs point bare `src/…` imports at `#` `pathAliases` / migrate-root-resolution
