## Context

Vite SSR commands are blocked today.

Webpack SSR uses Express `renderCallback`, string HTML, and CSP meta tags.

This change adds a **Vite-only SSR product** selected by `buildType`, with sku owning the server, Document shell, streaming, assets, and CSP headers, and React Router Data Mode owning routing/data.

## Goals / Non-Goals

**Goals:**

- Vite SSR via `buildType`
- Dual-entry `routes` + request-entry contracts
- Full-document streaming + document hydrate
- Shell CSP headers
- Per-route + vocab chunks (sku-owned `@vocab/vite` resolve)
- Create template + Migrating docs
- Experimental first release
- Single-port (`port` only; reject `serverPort`)
- Named `Component` on lazy pages in template/docs
- CJS interop docs
- Accurate config JSDoc
- Ship React Router 8 as an **optional peerDependency** `^8` (Vite SSR only; no hard sku dep)
- Keep shared Express dep on 4 (no 4 → 5 bump)
- No Jest transforms for React Router 8 in this change (Vite SSR requires Vitest)
- Docs steer: prefer render-time React data loading; loaders as opt-in; no Express→loader bridge
- Migrating guidance for server-only loaders, Braid reset order, client-only providers, Jest→Vitest, `#` pathAliases
- Config `polyfills` on the Vite SSR browser client (parity with static Vite / webpack SSR)
- Vite SSR `sku start` SSR-CSS (virtual stylesheet via Document assets; no `transformIndexHtml`)
- Vite SSR `sku start` telemetry parity (`start.initial` / `start.rebuild`; no `transformIndexHtml`)

**Non-Goals:**

- Webpack mode for this buildType
- Webpack SSR backfill or updating the Webpack-SSR create template
- Converting the static `vite` create template
- Full infra/deploy product guides (keep sku’s existing docs scope)
- Framework Mode / RSC
- Absolute/`CDN` `publicPath`
- First-class router-basename config
- Vite SSR `serverPort`
- Expanding baked-in CJS interop defaults beyond Apollo
- Consumer Document
- Runtime route-tree matching
- Production listen-logging parity
- Supporting the config `public` assets folder for Vite SSR (until a definitive need)
- Automatic `*.server.ts` client strip
- Auto-injecting Braid reset into sku’s Vite SSR server entry
- A new Jest→Vitest codemod beyond existing tooling/docs
- Bridging Express `req` (or middleware-attached state) into React Router loaders
- Shipping Jest support for React Router 8 (transforms / ESM interop)
- Forcing webpack fixtures or non–Vite-SSR apps onto React Router 8
- Treating RR loaders as the default teaching path for page content
- Shipping RR `requestContext` / `getLoadContext` seeding in this change (deferred unless demand remains)
- Upgrading sku’s shared Express dependency from 4 → 5 (deferred; would break webpack SSR)
- Supporting `@sku-lib/vite/loadable` (Collector / `LoadableProvider` / `preloadPlugin` module-id injection) as a Vite SSR document-preload source
- Supporting `dangerouslySetViteConfig` for Vite SSR (static Vite unchanged)

## Decisions

### 1. Webpack alignment principle

When choosing Vite SSR implementation details that overlap webpack SSR (compile-time defines, naming, shapes):

1. Do not copy webpack SSR patterns that are a poor fit for Vite SSR.
2. Do not diverge from webpack SSR naming or shapes without a concrete reason.

Prefer webpack-aligned defines (`__SKU_CSP__`, `__SKU_DEFAULT_SERVER_PORT__`) over inventing parallel `import.meta.env.SKU_*` knobs.

Prefer a single CSP object over many flat string defines.

Prefer dropping unused language allowlisting rather than baking `SKU_LANGUAGES` “because config exists.”

No sidecar runtime manifest — webpack-style defines are enough.

### 2. Mode selection via `buildType`

`buildType?: 'ssr' | 'static'`.

With Vite → `sku start` / `sku build`.

Webpack + this buildType → error.

`-ssr` when `buildType` is set → error.

Webpack SSR without buildType keeps `start-ssr` / `build-ssr`.

### 3. Data Mode, not Framework Mode

`createStaticHandler` / `createBrowserRouter` + `lazy`.

Errors via RR `ErrorBoundary` + `context.statusCode`.

Sku owns Vite plugins, Node server, and CSP (Framework Mode’s Vite plugin would compete).

### 4. Dual-entry `routes` + request entries

Reuse `serverEntry` / `clientEntry`.

Both MUST export `routes: RouteObject[]`.

Server: `onRequest`, `middleware`.

Client: `onHydrate`.

Hard errors if required named exports are missing (no early file-existence gate).

Trees MUST stay hydration-compatible (path/nesting/ids); implementations MAY diverge.

Docs/template recommend shared `createRoutes(...)` — not a sku API; no runtime checker.

Vite SSR request-entry wrappers resolve consumer entries via the same aliases as static Vite: `__sku_alias__serverEntry` / `__sku_alias__clientEntry`.

Note: tsdown/rolldown reorders static imports by specifier shape — `#…` sorted after `@vitejs/plugin-react/preamble` while `__…` sorted before it, so using `#` entry ids can surface the fragile “preamble must run before consumer JSX” Refresh ordering issue in the published client entry.

Mitigate with a start-only `#entries/vite-ssr-client.dev` that imports the preamble then dynamically loads the production client entry; production builds keep using `#entries/vite-ssr-client` with no preamble.

**Config `polyfills` (browser client):** Sku’s Vite SSR client entry (`vite-ssr-client.tsx`, including the start-only `.dev` wrapper’s production client load) MUST import `virtual:sku/polyfills` before hydrate / consumer client-entry code — same virtual module as static `vite-client.tsx`.

`polyfillsPlugin` remains on the shared Vite plugin graph; it is not static-only. Without that import the plugin is inert for SSR.

Polyfills apply to the **browser** client graph only. Do not load them into the Node server entry.

HTTP middleware (two layers; distinct from RR route `middleware`):

- **Production:** server-entry Express/Connect `middleware` (required; empty OK). Mounted in start and production.
- **Dev-only:** optional config `devServerMiddleware` — start only; never in the production server graph.
- **Dev order:** request-context → `devServerMiddleware` → server-entry `middleware` → Vite → HTML.

Document is sku-owned (React document metadata). No consumer Document override in v1.

### 5. Commands and deploy shape

Single-port Vite `middlewareMode` + `appType: 'custom'` for `sku start` (listen on `port`).

Build emits sibling `client/` and `server/`; production entry is `dist/server/server.js`.

`httpsDevServer` → HTTPS + HMR in start; production remains HTTP.

Webpack SSR’s dual-port mental model (`port` for assets + `serverPort` for the Node app) does **not** apply.

Vite SSR uses a single config `port` for `sku start` and as the baked production default listen port (`__SKU_DEFAULT_SERVER_PORT__`).

`process.env.PORT` still overrides at runtime.

Providing `serverPort` with Vite SSR MUST fail config validation (webpack-only).

Migrating docs must call this out (drop `serverPort`; map old `serverPort` → `port` or rely on `PORT`).

### 6. `publicPath` is the static asset prefix only (not React Router basename)

`publicPath` is sku’s asset prefix — the public URL path for static assets (webpack parity via `__SKU_PUBLIC_PATH__`).

**Production / `sku build`:** Vite `config.base` is set to `publicPath` so emitted client URLs match. The production server mounts `express.static` at that prefix. HTML injects assets under `publicPath`.

**`sku start`:** Ignore config `publicPath` and serve the Vite module graph from `/` (webpack SSR start parity). Bootstrap scripts are `/@vite/client` and `/@fs/…` — not under `publicPath`. Documents stay on app routes outside any asset prefix either way.

Sku MUST NOT treat Vite’s built-in `import.meta.env.BASE_URL` as a product concept or pass it (or `publicPath`) as React Router `basename`.

Basename stays unset (effectively `/`).

Path-prefixed SPA basenames are a discouraged pattern and MUST NOT become a first-class sku config.

Relative `publicPath` values like `/static/my-app` MUST work in production with app HTML served on routes outside that prefix.

Cover with a fixture or equivalent test (production asset prefix; start bootstrap at `/`).

Do **not** set Vite `config.base` to `publicPath` for `sku start` — that conflates Vite’s app-root with sku’s asset prefix and breaks static SPA start when shared.

### 7. No config `public` assets folder for Vite SSR

Config `public` designates a folder of files copied/served as-is (unhashed).

That pattern often bypasses content hashing / cache-safe URLs and is used to avoid production-ready asset serving.

Until there is a definitive need, Vite SSR MUST NOT support it.

Config always has a `public` path (default `'public'`), so the signal is directory existence — not whether the option is set.

On `sku start` / `sku build` for Vite SSR: if `paths.public` exists on disk, hard-error with guidance to import assets from scripts instead (Vite hashed pipeline).

Implementation MUST also disable the copy/serve path for this mode:

- Do **not** set Vite `publicDir` to `paths.public` (use `false` / unset for SSR).
- Do **not** call `copyPublicFiles` after the Vite SSR build.

Static Vite and webpack keep today’s `public` behaviour.

Docs MUST discourage the pattern for Vite SSR and note importing images/assets in modules as the alternative.

Migrating MUST call out moving off `public` when adopting Vite SSR.

### 8. No `dangerouslySetViteConfig` for Vite SSR

`dangerouslySetViteConfig` is a raw Vite escape hatch.

Sku opens escape hatches only for known best-practice needs.

As a new API without legacy to support, Vite SSR does not support this option.

When it is set with Vite SSR, config validation MUST hard-error and point consumers to sku-support channels with their use-case.

Static Vite keeps today’s behaviour.

Do not apply the decorator plugin on the Vite SSR plugin graph (redundant once validation rejects, but keeps the SSR path explicit).

Docs (`configuration.md` + Vite SSR product / Migrating) MUST state that the option is unsupported for Vite SSR and that exceptional Vite customisation needs should go through support first.

### 9. Full-document streaming

React owns `<html>`/`<head>`/`<body>`.

Pipe on `onShellReady`; optional `handle.waitForAll` → `onAllReady`.

Abort on disconnect.

Client: `hydrateRoot(document, …)`.

### 10. No `transformIndexHtml` on the SSR path

Preamble via client entry; Vite client + app via `bootstrapModules`; CSS/modulepreloads via manifest → Document; handoff via hashable `bootstrapScriptContent`.

Static Vite injects serve-only HTML (SSR-CSS link, telemetry clients) through `transformIndexHtml`.

Vite SSR MUST NOT call `transformIndexHtml` on document responses.

Serve-only concerns that still apply to Vite SSR `sku start` (SSR-CSS, telemetry) MUST inject via Document assets and/or the browser client entry / `bootstrapModules` instead — see Decisions 10a and 10b.

Production CSS remains client-manifest → Document (unchanged).

### 10a. SSR-CSS on Vite SSR `sku start`

`vitePluginSsrCss` collects CSS reachable from configured entries into `virtual:ssr-css.css` and (on static Vite) injects a `<link>` plus HMR cleanup via `transformIndexHtml`.

For Vite SSR `sku start`:

- Mount `vitePluginSsrCss` on the SSR plugin graph with entries that reach CSS in the SSR module graph (consumer `serverEntry` and/or sku’s Vite SSR server entry — not static’s `renderEntry`).
- Put the virtual stylesheet URL into Document `assets.css` so the existing Document `<link rel="stylesheet">` path emits it (no HTML transform).
- Move the HMR cleanup that removes stale `[data-ssr-css]` links onto a client-entry / bootstrap-module path (same “no transformIndexHtml” rule).
- Mark the Document link so cleanup can still target it (`data-ssr-css` or equivalent).

Production Vite SSR MUST NOT rely on this plugin — CSS comes from the client manifest.

Goal: avoid an unstyled flash on `sku start` until the client graph loads styles.

### 10b. Telemetry on Vite SSR `sku start`

`telemetryPlugin` is serve-only (`apply: 'serve'`). On static Vite it injects page-load + HMR client scripts via `transformIndexHtml` and wires Vite WS handlers / `handleHotUpdate`.

For Vite SSR `sku start`:

- Mount `telemetryPlugin` on the SSR plugin graph with tags such as `type: 'ssr'` (parity with static’s `type: 'static'`).
- Deliver the page-load and HMR client scripts via the Vite SSR browser client entry and/or a serve-only module in `bootstrapModules` — not via `transformIndexHtml`, and not as new Document inline scripts (CSP already tracks `bootstrapScriptContent`).
- Mark `initialPageLoad` when the SSR dev server is ready (static does this in `middlewarePlugin.configureServer`). `skuStart.mark()` in `viteStartHandler` already covers both modes.
- Keep WS handlers + `handleHotUpdate` behaviour once the plugin is on the middleware-mode server.

Emit the same metrics as static start: `start.initial` and `start.rebuild`.

### 11. CSP: headers from shell

Derive `script-src` before `pipe`.

Enforcing and/or Report-Only (`cspReportOnlyReportTo`).

Relative `publicPath` only (asset base; still covered by `'self'`).

No meta `http-equiv`.

**Coexistence with static Vite CSP (merged from master):** Static Vite now has `cspDelivery: 'tag' | 'header'` (meta vs `metadata.csp` JSON) and Report-Only via `createCSPHandler` → `metadata.cspReportOnly` / start-time headers. That path is separate from Vite SSR. Vite SSR keeps its own `buildCspHeaders` (real response headers, lazy single nonce, `cspReportOnlyReportTo`). Do not route Vite SSR through `cspDelivery` or the static HTML CSP handler.

### 12. Request-entry shapes

```ts
// serverEntry
export const routes: RouteObject[];
export function onRequest(args: { request: Request }): {
  AppWrapper?: ComponentType<{ children: ReactNode }>;
  language?: string;
  clientContext?: JsonValue;
};
export const middleware: RequestHandler | RequestHandler[];

// clientEntry
export const routes: RouteObject[];
export function onHydrate(args: { context: JsonValue | undefined }): {
  AppWrapper?: ComponentType<{ children: ReactNode }>;
};
```

Tree: `Document` → router → optional pathless `AppWrapper` → entry `routes`.

`language` is server-local for Document vocab preload only (not Async Local Storage, not `onHydrate`).

`clientContext` → hydrate `context`.

### 13. Request-scoped nonce (lazy, single value)

At most one CSP nonce per render, minted only when requested.

Async Local Storage holds **CSP nonce only**.

### 14. Vocab / language chunks

When `languages` is set: `@vocab/vite` splitting at build time.

**Resolve ownership:** `@vocab/vite` is a sku dependency. Consumers MUST NOT need a direct `@vocab/vite` dep for resolve to succeed.

When the vocab plugin / `languages` is active, sku’s shared Vite config (`packages/sku/src/services/vite/plugins/config.ts`) MUST:

1. Resolve `@vocab/vite` from **sku’s** install tree (`createRequire(import.meta.url)`), not the app’s `node_modules`.
2. Pin bare imports onto that copy via `resolve.alias`:
   - `@vocab/vite/runtime` → absolute file from `require.resolve('@vocab/vite/runtime')` (prefer the export file, not only the package name — more reliable under Rolldown/Vite).
   - Do **not** alias the `@vocab/vite` package root — that breaks subpath imports such as `@vocab/vite/chunks` (sku’s own SSR render imports it).
3. Apply aliases in the **shared** Vite config (covers both client and SSR builds today).

That forces injected imports (including ones `@vocab/vite` injects into `.vocab` files) onto sku’s copy — one instance, aligned with the plugin sku loaded.

**Shared packages:** The alias is project-wide. It also covers bare `@vocab/vite/runtime` from shared React packages (e.g. Header/Footer with `.vocab`) when those modules are in the Vite graph — the usual sku path via `compilePackages` (SSR `noExternal`). Vocab’s compile ignore already skips only `node_modules/sku/**` and `node_modules/vocab/**`, so dependency `.vocab` folders remain discoverable; sku separately compiles configured `compilePackages` roots because Vocab’s own compile ignores `node_modules`.

Out of scope / does not help: packages left as true SSR externals where Node resolves `@vocab/vite/runtime` at runtime outside Vite (uncommon for sku shared UI).

If a consumer also installs `@vocab/vite`, the alias still prefers sku’s copy.

Do **not** enable these aliases when vocab / `languages` is inactive (avoid resolving unused).

At render time, register `getChunkName(language)` on Document assets **only** when `onRequest` returns `language`.

Language is optional — if omitted, sku does not register a language chunk.

Sku does **not** validate the returned language against config, and does **not** default to a sole configured language.

No `getSkuLanguage` / `__SKU_LANGUAGE__` / baked `SKU_LANGUAGES` define.

Migrating / Vocab docs MUST **not** tell consumers to install `@vocab/vite` solely so `@vocab/vite/runtime` resolves.

### 15. Production runtime defines (webpack-aligned)

Production `server.js` has no live `skuContext`.

Bake the values it needs with webpack-style defines (no sidecar JSON):

- `__SKU_DEFAULT_SERVER_PORT__` — default listen port from config `port` (same value as `sku start`). Keep the webpack-aligned define **name**; do not introduce a second Vite SSR port knob. `process.env.PORT` still wins at runtime. Providing `serverPort` with Vite SSR MUST error.
- `__SKU_PUBLIC_PATH__` — static asset prefix from config `publicPath` (webpack SSR parity). Do not use Vite’s `import.meta.env.BASE_URL` in sku runtime code.
- `__SKU_CSP__` — single object aligned with webpack’s `{ enabled, extraHosts }`, extended for Vite Report-Only fields (e.g. `reportOnlyEnabled`, `reportOnlyExtraHosts`, `reportOnlyReportTo`).

Dev continues to pass these from live `skuContext` (no defines required on the start path).

### 16. Lazy-route `moduleId` (Vite SSR preload source)

Auto-derive for idiomatic `lazy: () => import('…')`.

Never overwrite explicit; skip non-idiomatic; warn in dev on miss.

Vite SSR Document CSS / `modulepreload` links come **only** from matched-route `handle.moduleId` values (plus optional vocab language chunks) resolved against the Vite client manifest.

`@sku-lib/vite/loadable` remains the static / prerender code-splitting and preload API (`createPreRenderedHtml` + Collector / `LoadableProvider` + `preloadPlugin` third-arg `moduleId` injection).

Vite SSR does **not** wire that collector into the streamed Document.

Rationale: React Router Data Mode already owns route-level splitting via `lazy`. A second loadable-based preload channel would duplicate the API, leave Document assets out of sync with “I used loadable,” and complicate Migrating from webpack SSR (which already requires a route-model rewrite).

Nested component splits inside a route are not first-class Document preloads in v1; consumers can still use client-side lazy loading without sku injecting those chunks into the initial HTML.

### 17. Intent module preload (fixture pattern, not a sku API)

Document `modulepreload` covers the _matched_ route.

Intent warm-up of _next_ lazy chunks (hover/focus/touch) is a consumer/fixture pattern — Data Mode has no `<Link prefetch>` (Framework Mode only).

The Vite SSR fixture demonstrates it with `PreloadingLink` + `ClientRoutesContext` provided from the client `AppWrapper` (same `routes` instance as the entry export), so a `createRoutes(...)` factory does not create a circular import through the layout.

Calling `route.lazy()` is enough (module cache); no route-tree mutation.

Loader-data prefetch is out of scope for this demo.

Sku does **not** ship a public PreloadingLink API.

### 18. Shared HTML middleware + loader/action headers

Dev/prod share abort-before-write.

On streamed HTML, forward `loaderHeaders` / `actionHeaders` (append; preserve `Set-Cookie`), then sku `Content-Type` / CSP.

### 19. Hydration payload safety

Promise-scrub `loaderData` / `actionData`.

Production route errors omit `Error.stack`.

### 20. Create template + Migrating docs

Template `vite-ssr` with `createRoutes` scaffold.

Lazy page modules MUST use React Router Data Mode named `export function Component` (not `export default`) so they typecheck with `lazy: () => import('…')`.

Migrating docs cover Static App and Older / Webpack SSR App; not under `docs/migration-guides/`.

Migrating MUST cover:

- named `Component`
- webpack dual-port → Vite SSR single `port` (reject `serverPort`; `PORT` still overrides prod)
- `dist/server/server.js` + sibling `client/`/`server/`
- CJS interop for `sku start`
- Express 4 typing (shared sku major; no Express 5 in this change)
- React Router 8 as optional peerDependency `^8` for Data Mode / route typing (Vite SSR template/fixtures install it)
- move off config `public` / public assets folder (import assets instead)
- that `dangerouslySetViteConfig` is unsupported (hard-error; raise use-cases via sku-support)
- server-only loaders vs client route graph (+ explicit `moduleId` when needed)
- prefer render-time data loading via `AppWrapper`; loaders for waterfalls / document redirects / headers
- no Express `req` → loader bridge (stay on webpack SSR / raise with sku-support if needed)
- Braid reset-before-Braid on `sku start` (Braid apps; no sku auto-inject)
- client-only / `onHydrate`-only providers for `window`-touching libraries
- Jest → Vitest prerequisite (link existing docs / codemod)
- `#` pathAliases / migrate-root-resolution for bare `src/…`
- sku-owned `@vocab/vite` resolve (no consumer pin for `@vocab/vite/runtime`)

#### Server-only loaders vs client route graph

If a route factory (or shared module) is imported by both entries, dynamic imports inside it (e.g. `import('./loadHomeData')`) can pull server-only modules into the client build.

Keep server-only loader modules on the server tree only (e.g. separate `routes.server.tsx` / `*.server.ts` pages).

When the lazy factory is no longer a bare `() => import('./home')`, set `handle.moduleId` explicitly so modulepreload still works.

Do **not** ship an automatic `*.server.ts` client strip in this change — convention + docs only.

Prefer not to rely on server-only loaders for page content — see data-loading guidance below.

#### Braid reset evaluation order (`sku start`)

On `sku start`, Vite’s SSR module graph can evaluate a loader → page → Braid before `App.tsx`’s `import 'braid-design-system/reset'`, throwing “Braid components imported before reset.”

Production build may succeed with a different order.

Apps that use Braid must ensure reset runs before any Braid-touching server module (e.g. top of `serverEntry` and any early-imported loader that pulls Braid).

Do **not** auto-inject Braid reset into sku’s Vite SSR server entry — Braid is optional per app.

#### Client-only providers during Document SSR

Providers that construct against `window` (e.g. analytics SDKs) throw during full-document SSR.

Webpack SSR often only mounted those on `#app` client hydrate.

Keep such providers out of the SSR tree — client-only wrappers (`useEffect` mount) or `onHydrate`-only `AppWrapper` when loader data is available.

#### Jest → Vitest prerequisite

Vite SSR apps are expected to use `testRunner: 'vitest'`.

Migrating MUST call this out as a prerequisite and point at existing Vitest docs / `@sku-lib/codemod jest-to-vitest` / checklist (mock shapes, RTL, platform singletons).

No new Jest→Vitest codemod in this change.

#### Path aliases: bare `src/…` → `#src/…`

Webpack `baseUrl: '.'` allowed `import 'src/…'`.

Vite SSR `pathAliases` require `#` subpath imports.

Migrating MUST point at `pathAliases` + the existing `migrate-root-resolution` codemod / changelog guidance.

### 21. Data loading guidance (docs-led)

Prefer **render-time** data loading in React for page content:

- Inject an env-specific API / Experience client via `AppWrapper` (`onRequest` / `onHydrate`).
- Fetch in the React tree with Suspense (e.g. `useQuery`) so the same components work on SSR and client navigations.

Rationale: portable shared UI without per-app loader wiring; aligns with streaming Document and isomorphic backends.

Reach for React Router **loaders** when you need to:

- start work before the suspending subtree renders (waterfall / parallelisation), or
- issue a real **document** `redirect()` / response headers (`Cache-Control`, `Set-Cookie`, …).

`<Navigate />` on static initial render is a no-op — it is not a document HTTP redirect.

Loaders receive a Fetch `Request`, not Express `req`.

Sku MUST NOT bridge Express middleware state into loaders in this change (`getLoadContext`, general Async Local Storage bag, or passing `req`).

Apps that need a rich Express bag to load page data should stay on webpack SSR for now and raise the use-case with sku-support.

**Deferred (not this change):** optional RR `requestContext` / `getLoadContext` seeded from Fetch / `onRequest` as advanced isomorphic DI for loaders — only if real demand remains after the preferred path.

Product + Migrating docs MUST encode this hierarchy and rebalance any wording that implied loaders are the default for content.

### 22. Experimental first release

Docs warning + changeset: available for testing, not for production.

No runtime experimental gate.

### 23. CJS default-export interop (docs only)

Keep existing `vite-plugin-cjs-interop` + `__UNSAFE_EXPERIMENTAL__cjsInteropDependencies` and Apollo-only baked defaults.

Do **not** expand sku’s default interop list for this change.

Document the start-vs-build failure mode (“Element type is invalid … got: object”) and how to extend the config list, with common open-source offender examples.

Do **not** rewrite or wrap React render errors at runtime — docs are enough.

### 24. Express 4 (shared) + React Router 8 (optional peer)

Vite SSR mounts consumer middleware into sku’s **shared** Express app — the same `express` / `@types/express` dependency webpack SSR and `sku serve` use.

This change keeps that major on **Express 4**. It does **not** upgrade Express 4 → 5.

A single Express major cannot be Express 5 for Vite SSR and Express 4 for webpack SSR without splitting the package. Upgrading would be a breaking change for webpack SSR middleware / `onStart` / `devServerMiddleware` and related typings.

Static Vite is unaffected (Connect), but webpack SSR is in the blast radius.

Vite SSR targets **React Router 8** via an **optional peerDependency** `react-router: ^8` (not a hard sku dependency). RR is Vite SSR–scoped and is not shared the way Express is.

Vite SSR template and fixtures install React Router 8. Webpack / static apps do not need it and MUST NOT be forced onto RR8 by this change (do not bump webpack fixtures solely to RR8).

Sku MUST NOT ship Jest transforms for `react-router` / `cookie-es` / `import.meta` in this change. Vite SSR requires Vitest; React Router 8 + Jest for webpack consumers is out of scope.

Document Express 4 for middleware typing (`middleware` / `SkuSsrMiddleware`) and React Router 8 for Data Mode / route typing consumers rely on.

Align any React Router 8 peer baselines sku already owns (Node / React / Vite) where the catalog or engines need a bump; do not expand sku’s supported React range solely for packages that still support React 18 unless required by the upgrade.

Sku owns the Express app that mounts consumer middleware and the React Router Data Mode wiring for Vite SSR.

Those packages are not opaque transitive deps — their majors are part of the Vite SSR product contract (Express via the shared sku server; React Router via Data Mode peer + consumer install).

Keep majors pinned in docs and release notes; call out major bumps in changesets as potentially breaking for Vite SSR consumers.

**Breaking-change policy (later releases):** bumping the Express or React Router major that Vite SSR integrates may be a breaking change.

Consumer `middleware` / `devServerMiddleware` mount into sku’s Express app, and consumer routes/entries use React Router Data Mode APIs (`routes`, `lazy` + named `Component`, loaders/actions, etc.).

Minor/patch upgrades within the documented major remain non-breaking when APIs stay compatible.

**Deferred:** Express 5 as a separate sku-wide breaking change (webpack SSR + Vite SSR + `sku serve` together). Jest support for React Router 8 (if ever needed for webpack) is a separate concern.

## Risks / Trade-offs

| Risk                                | Mitigation                                                                                                                                          |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dual `routes` hydration mismatch    | Docs + template `createRoutes`; no runtime checker                                                                                                  |
| Shell-only CSP / late scripts       | Lazy single nonce; hash known bootstrap bodies                                                                                                      |
| Absolute/`CDN` `publicPath`         | Config rejects; relative-only docs; no browser e2e for this edge case                                                                               |
| `publicPath` coupled to basename    | Never pass `publicPath` as RR basename; bake `__SKU_PUBLIC_PATH__`; fixture for `/static/...` assets                                                |
| Start vs prod asset URLs            | Start: Vite graph at `/`; build/prod: `base` + static mount under `publicPath` (webpack start parity)                                               |
| Unhashed `public` folder assets     | Hard-error if `paths.public` exists; disable `publicDir` / `copyPublicFiles` for Vite SSR; Migrating + docs                                         |
| `dangerouslySetViteConfig` on SSR   | Hard-error when set; omit decorator plugin on SSR graph; docs + sku-support for use-cases                                                           |
| CJS “got: object” on `sku start`    | Docs; consumer extends interop list (no new defaults; no runtime error rewrite)                                                                     |
| Mock deps ship in prod              | `devServerMiddleware` only; never from server entry                                                                                                 |
| Early production use                | Experimental docs + changeset                                                                                                                       |
| Express / RR major drift            | Keep shared Express on 4; RR 8 optional peer for Vite SSR only; docs + changeset mark later major bumps as potentially breaking; Express 5 deferred |
| RR 8 peer baselines                 | Optional peer `^8`; align engines with RR 8 minimums sku already can meet; document consumer React/Node expectations; template installs RR 8        |
| Jest + RR 8 (webpack)               | Out of scope: no Jest transforms in this change; Vite SSR requires Vitest; do not force webpack fixtures onto RR 8                                  |
| Server loaders leak to client       | Migrating: split server-only modules; explicit `moduleId` when lazy is non-idiomatic                                                                |
| Braid reset before Braid on start   | Docs: reset early on server graph; no sku auto-inject                                                                                               |
| `window` providers in Document SSR  | Migrating: client-only / `onHydrate`-only wrappers                                                                                                  |
| Jest apps on Vite SSR               | Migrating: Vitest prerequisite; link existing vitest docs / codemod                                                                                 |
| Nested `@vocab/vite/runtime`        | Sku `createRequire` + `resolve.alias`; validate translations Vite SSR without consumer pin                                                          |
| Bare `src/` imports under Vite      | Migrating: `#` `pathAliases` + migrate-root-resolution                                                                                              |
| Express `req` → loader pressure     | Docs: prefer AppWrapper + Suspense; no Express→loader bridge; webpack SSR + sku-support if blocked                                                  |
| Server-only loaders as default      | Docs steer render-time content loading; loaders for waterfalls / document redirects / headers only                                                  |
| Start FOUC without SSR-CSS          | Document `assets.css` gets virtual stylesheet on `sku start`; production stays on manifest CSS                                                      |
| Telemetry missing on Vite SSR start | Mount `telemetryPlugin` on SSR graph; client scripts via client entry / bootstrap; mark `initialPageLoad` on ready                                  |

## Migration Plan

Opt-in via `buildType` + Vite.

New apps: `--template vite-ssr` (named `Component`).

Existing: Migrating docs (ports, deploy layout, CJS, Express 4, React Router 8 optional peer, `Component`, move off `public`, data-loading steer, server-only loaders, Braid reset order, client-only providers, Jest→Vitest, `#` pathAliases, sku-owned `@vocab/vite`).

Webpack SSR: leave `buildType` unset.

Rollback: remove `buildType`.

## Open Questions

- **Custom logger for setup behaviours?** Until decided, production Vite SSR does not add listen logging.
- **RR `requestContext` / `getLoadContext` later?** Deferred per data-loading guidance — revisit only if isomorphic AppWrapper + Suspense does not cover real loader DI demand.
