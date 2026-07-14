## Context

Vite SSR commands are blocked today. Webpack SSR uses a low-level Express `renderCallback`, `@loadable` extraction, dual-port dev proxy, and CSP as `<meta http-equiv>`. Vite already has an internal `ssr` environment, but only for static prerender of `renderEntry` (string HTML → `transformIndexHtml` → `res.end`).

This change introduces a **new Vite-only SSR product** selected by sku config `renderType`, not by `start-ssr` / `build-ssr`. sku owns the server, React document shell, streaming, bootstrap/assets (without `transformIndexHtml` on the SSR path), and CSP headers; React Router Data Mode provides routing, loaders/actions, and Suspense-friendly data.

Reference architecture: [basic-streaming-app-example](https://github.com/jahredhope/basic-streaming-app-example) (full-document stream, `hydrateRoot(document)`, explicit bootstrap/assets/preamble). Research notes live in `ignore_ssr-research/` (local, not part of this change).

## Goals / Non-Goals

**Goals:**

- Select SSR vs static via `renderType: 'server-side-rendered' | 'static-generated'`
- High-level app export (routes + middleware) instead of hand-rolled HTML responses
- Optional separate server/client request entries for per-request `AppWrapper`, language identity, and serialisable `clientContext`
- Full-document React root with shell-first streaming and document-level hydration
- Explicit asset/bootstrap story that replaces `transformIndexHtml` on the stream path
- Shell-derived CSP as HTTP headers, with optional request-scoped nonces/hashes and optional Report-Only
- `sku start` / `sku build` produce a runnable Vite SSR server when `renderType` is `'server-side-rendered'`
- Per-route async chunks (RR `lazy` + Vite dynamic import) with a fixture that demonstrates distinct route chunks
- Vocab/language async chunk registration for Vite SSR when `languages` is configured

**Non-Goals:**

- Implementing the new SSR mode on webpack (reject that config combination)
- Changing webpack’s existing `start-ssr` / `build-ssr` path when `renderType` is unset or `'static-generated'`
- React Router Framework Mode (`@react-router/dev` Vite plugin)
- Preserving `renderCallback` / `flushHeadTags` / meta CSP for Vite SSR
- RSC / Flight
- Unifying static prerender onto the Document component in v1
- Absolute / CDN `publicPath` for Vite SSR (relative public asset paths only in v1)

## Decisions

### 1. Mode selection via `renderType` (not `-ssr` commands)

**Choice:** Add sku config:

```ts
renderType?: 'server-side-rendered' | 'static-generated';
```

- `'server-side-rendered'` + `bundler: 'vite'` → Vite SSR via `sku start` / `sku build`
- `'static-generated'` (or unset, preserving today’s default) → existing static / SSG paths
- `'server-side-rendered'` + `bundler: 'webpack'` → **error** (new SSR mode is Vite-only)
- `sku start-ssr` / `sku build-ssr` when `renderType` is set → **error** (use unsuffixed commands; `-ssr` is not part of this mode)

**Why:** Render mode belongs in config beside `bundler`, not in parallel CLI surface. Consumers already use `start` / `build` for Vite; SSR should not invent a second command pair.

**Rejected:** Reusing webpack’s dual-port `start-ssr` / `build-ssr` UX for Vite SSR.

**Legacy:** Webpack SSR without `renderType: 'server-side-rendered'` continues via `start-ssr` / `build-ssr` (out of scope to migrate).

### 2. Data Mode, not Framework Mode

**Choice:** sku implements SSR with React Router Data Mode (`createStaticHandler` / `createBrowserRouter` + `lazy` routes).

**Why:** “Routing handled by sku, implemented by react-router” requires sku to own Vite plugins, the Node server, and CSP. Framework Mode’s Vite plugin would compete with sku’s bundler stack and hide the server/CSP surface.

**Error pages:** Route errors (including `404` / `405` / thrown `data()` / loader failures) are React Router `ErrorResponse`s on the static handler context. sku streams the document with `context.statusCode` and renders the nearest route `ErrorBoundary` (or RR’s default error UI). There is no sku-owned error-page API — document customization via React Router’s ErrorBoundary guidance (data-mode `ErrorBoundary` + `useRouteError` / `isRouteErrorResponse`), with a short example in `server-rendering.md`.

**Rejected:** Wrapping `@react-router/dev/vite` — faster feature parity, but sku would no longer own routing/server abstractions.

### 3. Consumer interface: SkuApp + optional request entries

**Choice:** Consumers export a `SkuApp` module via `appEntry` (default `src/app.tsx`):

```ts
export default {
  routes: RouteObject[], // React Router Data Mode route tree (prefer lazy)
  middleware?: RequestHandler | RequestHandler[], // Connect-compatible
} satisfies SkuApp;
```

Optionally, consumers also provide **separate** server and client request-entry modules via the existing `serverEntry` / `clientEntry` config keys (defaults `src/server.tsx` / `src/client.tsx`). When `bundler: 'vite'` and `renderType: 'server-side-rendered'`, these paths mean the closed request-hook contracts in decision 16 — **not** webpack `renderCallback` / static hydrate — and MUST NOT own the HTML response. Separate files keep server-only code out of the client graph and make the SSR/client asymmetry explicit. Path extension is whatever the consumer configures (`.tsx` / `.ts` / `.js`); docs that still say `.js` are stale — code defaults are `.tsx`.

sku provides the HTTP(S) server, Vite client+server builds, streaming render, Document assets, hydration bootstrap, and CSP. Consumers do **not** send HTML via `res.send` for the document response.

**Middleware:** Vite SSR mounts **`SkuApp.middleware` only** (before Vite middlewares and the HTML render path). Config `devServerMiddleware` remains the static Vite / webpack path and MUST NOT be silently relied on for Vite SSR — document that consumers should move request middleware into `SkuApp.middleware`. Middleware remains for HTTP side effects (redirects, auth, cookies); render-scoped composition and language identity belong in the server request entry (decision 16), not Express mutation of a language slot.

**Known limitation (v1):** App middleware is loaded once at dev-server start (not HMR’d). Route modules / `render` / request entries reload via `ssrLoadModule` where applicable; middleware edits require a restart.

**Rejected:** Porting webpack’s `renderCallback` contract into Vite SSR — keeps the low-level multipart model that fights streaming. Reusing the `serverEntry` / `clientEntry` **keys** is fine; the Vite SSR **export shape** must stay the closed request-hook bag.

**Rejected:** Putting request handlers on `SkuApp` itself — crowds the shared app module and blurs the server-only boundary.

**Rejected:** `SkuApp.document` / consumer Document override — prefer conformity over configuration. sku owns the default Document (assets → CSS + modulepreload). Head/SEO metadata belongs in routes/layouts via React 19’s native `<title>` / `<meta>` / `<link>` hoisting, not a swappable shell (override is also a footgun: consumers must re-render asset links correctly). **Revisit later** if a real consumer need appears that React metadata and a sku-owned Document cannot cover (e.g. unavoidable `<html>` / `<body>` attributes sku does not yet own). Can always add an override API later without breaking the default.

### 4. Commands and deploy shape

**Choice:** When `bundler: 'vite'` and `renderType: 'server-side-rendered'`, `sku start` runs a single-port server with Vite in `middlewareMode` + `appType: 'custom'`; `sku build` emits sibling `client/` and `server/` directories under the configured build target.

**Production output layout:** Under the configured build target (e.g. `dist`), emit sibling directories:

- `client/` — browser assets + Vite client manifest
- `server/` — runnable Node server entry and SSR bundle

Neither directory MUST be nested inside the other (not `server/client`, not `client/server`).

**Rejected:** Dual-port webpack SSR UX for Vite; keeping `-ssr` commands as the Vite SSR entrypoint.

**HTTPS (`httpsDevServer`):** Required for Vite SSR parity with static Vite / webpack. When `httpsDevServer: true`, the single-port Vite SSR dev server MUST listen over HTTPS with sku’s self-signed cert (same `.ssl` / `getCertificate` path as other sku commands) and wire Vite HMR to that HTTPS server so advertised URLs (`https://…`) match the listener. Production `node dist/server/server.js` remains plain HTTP (TLS at the edge), unchanged.

**Production listen logging:** Out of scope for v1 — see §9 and Open Questions (custom logger). Dev `sku start` continues to advertise URLs via the shared URL printer.

### 5. Full-document streaming (not `#app`)

**Choice:** React owns `<html>` / `<head>` / `<body>`. Server pipes `renderToPipeableStream` to the response; client uses `hydrateRoot(document, …)`. sku ships and owns the Document (assets → CSS + modulepreload links); consumers do not override it (see rejected `SkuApp.document` under decision 3).

**Defaults:**

- Pipe on `onShellReady` (shell-first Suspense)
- Optional buffer-all via `onAllReady` when a matched route sets `handle.waitForAll: true`
- Abort in-flight render when the client disconnects
- **React ≥ 19 required** for Vite SSR: doctype from `<html>` — do not double-emit

**Rejected:** Keeping string `renderDocument` + `#app` hydrate for Vite SSR — blocks document-level hydration and head streaming.

### 6. No `transformIndexHtml` on the SSR path

**Choice:** Streaming SSR responses MUST NOT call `transformIndexHtml`. Reimplement Vite/plugin concerns explicitly:

| Concern                 | Approach                                                                   |
| ----------------------- | -------------------------------------------------------------------------- |
| React Refresh preamble  | Client entry import `@vitejs/plugin-react/preamble` (sku wrapper)          |
| Vite client + app entry | `bootstrapModules` (dev: Vite client + client entry; prod: manifest entry) |
| CSS + modulepreloads    | Manifest / collector → Document props; serialize for hydration identity    |
| Client / router handoff | Hashable `bootstrapScriptContent` (combine bodies where possible for CSP)  |
| SSR CSS / telemetry     | Streaming-equivalent path **or** explicitly deferred in docs               |

`index.html` (if any) is for client-entry discovery only — not an SSR template split on `<!--app-html-->`.

Static Vite `sku start` may keep `transformIndexHtml` unchanged.

### 7. Streaming and route chunks

**Choice:** Default render path is `renderToPipeableStream` with headers set in `onShellReady`. Route modules use RR `lazy` + Vite dynamic import so each route is an async chunk. Deferred loader promises + Suspense/`Await` work without consumer stream plumbing.

**Edge cases:**

- Shell errors → error response before headers/body
- After shell starts → document stream-error behavior; abort timeout configurable later
- Post-shell inline scripts cannot be hash-scanned for CSP → nonces (passed into the stream)

### 8. CSP: headers from shell, plus Report-Only

**Choice:** Before piping the body, derive `script-src` (and related script allowances) from **shell HTML** (bootstrap scripts, known inline tags, configured extra hosts, sha256 of known bootstrap bodies, and a request nonce **only if requested** — see decision 12). Set:

- `Content-Security-Policy` when enforcing CSP is enabled
- optional `Content-Security-Policy-Report-Only` (may coexist with enforcing), with optional configurable `report-to` via `cspReportOnlyReportTo` (CSP directive only; consumers supply `Reporting-Endpoints`)

Config direction (Vite SSR only): keep/extend `cspEnabled` / `cspExtraScriptSrcHosts`; add report-only enablement, extra hosts, and `cspReportOnlyReportTo`; expose a request-scoped nonce helper that is opt-in per response (see decision 12).

**`publicPath` (Vite SSR):** Relative paths only (e.g. `/`, `/static/`). Document assets and CSP rely on `'self'`. Absolute `http(s):` / CDN `publicPath` is **out of scope** for Vite SSR — reject at config validation (or equivalent clear failure). Webpack SSR / static apps may keep existing absolute-`publicPath` behavior unchanged. Consumer `cspExtraScriptSrcHosts` remains for third-party scripts only.

**Static serving:** Mount client assets under the relative `publicPath`. Do not implement CDN/absolute-URL static-mount special cases for Vite SSR.

**Rejected:** Meta `http-equiv` injection — invalid once streaming starts; headers are the correct delivery.

**Dev:** Loosen policy for Vite HMR (`unsafe-eval`, WS connect) in development only.

### 9. Scope deferrals for v1

- Multi-site / multi-environment combinatorial prerender: **out** (request-time context instead)
- Static prerender sharing the same Document component: follow-up
- Full migration guide from webpack SSR: not required (non-goal to backfill)
- **SSR-CSS plugin (`vitePluginSsrCss`) and telemetry HTML inject:** deferred for Vite SSR. Those plugins rely on `transformIndexHtml`, which the streaming path intentionally skips. Static Vite keeps both. Vite SSR CSS in production comes from the client manifest → Document links; in development the Vite client injects CSS. Telemetry for Vite SSR is a follow-up.
- **Production listen / setup logging:** deferred. Webpack SSR logs `sku SSR server started on port …`; Vite SSR production (`node dist/server/server.js`) intentionally does not. Whether sku should accept a custom logger (or otherwise own setup logs such as “listening on port”) is an open product decision — do not hard-code a `console.log` parity gap-fill until that is clear.

### 10. Hydration payload safety

**Choice:** Bootstrap serialization (`window.__staticRouterHydrationData` / document assets) MUST be safe for production:

- Run promise-scrubbing (`replacePromises` or equivalent) on **both** `loaderData` and `actionData` before `JSON.stringify`.
- In production, serialized route `Error` objects MUST include message (and RouteErrorResponse fields) but MUST NOT include `Error.stack` (no server stack leak to the client). Dev may include stacks for debugging.

### 11. Shared HTML render middleware (abort-before-write)

**Choice:** Dev (`createDevSsrServer`) and production (`listen` / `createHtmlRenderMiddleware`) MUST share one HTML render middleware (or identical abort guards). After `render()` resolves, if the request abort signal has fired, do **not** set headers or `pipe` the body. Client disconnect aborts in-flight `renderToPipeableStream`. Avoid duplicated middleware that drifts (review found prod checked abort; dev did not).

**Document response headers:** After `query()`, when streaming HTML (not a short-circuit `Response`), sku MUST forward React Router `context.loaderHeaders` and `context.actionHeaders` onto the Express response (append; preserve multi-value headers such as `Set-Cookie`), then apply sku-owned headers (`Content-Type`, CSP). Matches React Router’s custom Data Mode SSR contract (`data(..., { headers })` / loader header returns). Short-circuit `Response` values from `query` continue to be forwarded wholesale (existing redirect path).

### 12. Request-scoped nonce API for Vite SSR (lazy, single value)

**Choice:** Vite SSR uses **at most one** CSP nonce per HTML render/request, generated **only when explicitly requested**, and included in the CSP header **only if requested**.

**How “requested” works (lazy):**

- Start the request with no nonce.
- Consumer code requests a nonce by calling `getCspNonce()` (loaders/actions) or an Express equivalent such as `req.getCspNonce()` (a read that mints; do not always assign `req.skuCspNonce` in middleware up front).
- sku requests the same way only when it will attach a `nonce` to scripts that cannot be hashed (e.g. React stream scripts).
- First request mints one value and remembers it; later calls return the same value.
- After `render()` finishes and before setting CSP headers / `pipe`, include `'nonce-…'` in the policy **only if** a nonce was requested; otherwise emit CSP without a nonce allowance.

**Why:** CSP best practice is one nonce reused for every nonce-bearing script on that response. Putting `'nonce-…'` in the header when nothing uses it widens the policy for no benefit. Static/webpack `createUnsafeNonce()` may be called multiple times and adds each value to the policy; Vite SSR intentionally does **not** offer that multi-nonce factory.

**Rejected:** Always minting a nonce when CSP / report-only is enabled; always putting a nonce in the CSP header “just in case”; a Vite SSR helper that returns a new distinct nonce per call.

### 13. Lazy-route `moduleId` / production preloads

**Choice:** Auto-derive `handle.moduleId` for the idiomatic React Router pattern `lazy: () => import('…')` via a Vite SSR transform (same path-resolution idea as the loadable `preloadPlugin`: resolve the import relative to the file, sniff the real extension, emit a cwd-relative Vite client manifest key).

**Conservative matcher (must not guess):**

- Only object property `lazy` whose value is a function containing exactly one string-literal `import()`
- Never modify the `lazy` function body — only ensure sibling `handle.moduleId`
- Never overwrite an existing explicit `handle.moduleId`
- Skip multi-import / granular `lazy: { … }` / indirect bindings (no injection)

**Runtime unchanged:** After `query()`, walk `context.matches` and collect every matched route’s `handle.moduleId` (nested lazy ancestors included). Missing or unknown ids still warn in development; production miss = skipped preload only.

**Rejected:** A separate `lazyRoute()` helper (opt-in API) as the primary path; ambient derive on the documented RR pattern is preferred. Manual `moduleId` remains as an escape hatch. Shipping silent miss in `resolveAssets` with no consumer signal.

### 14. Vocab / language chunks (required)

**Choice:** Vite SSR MUST support vocab language async chunks when `languages` is configured — not deferred.

- **Build:** Keep `@vocab/vite` chunk splitting (`createVocabChunks` in the client/SSR build code-splitting groups), same as static Vite.

Split two concerns that webpack conflated in `addLanguageChunk`:

- **Registration (sku-owned):** When an active language is known for the request, register that language’s chunk name (`getChunkName(language)` from `@vocab/vite/chunks`) into the Document asset / preload collector used for the streamed response — parity with static Vite `loadableCollector.register(getChunkName(...))` and webpack SSR `extractor.addChunk(getChunkName(language))`. Do **not** expose a webpack-style `addLanguageChunk` collector callback on the high-level app API.
- **Identification (app-owned):** The active language MUST be a configured language **name** (e.g. `th-TH`, `en-AU`) — the same value Vocab uses — not necessarily a URL path segment. SEEK (and many multi-site apps) compose locale from site/region + language prefix in the **server request entry**; sku MUST NOT encode that URL logic.

**Resolution order** (first match wins; value MUST be in configured `languages` or `en-PSEUDO`):

1. `language` returned from the server request entry (decision 16) — **the only app-owned identification path** for Vite SSR
2. Sole configured language when only one is set
3. Otherwise skip vocab chunk registration (soft-fail — no error)

sku seeds the request-context language store from (1) so loaders/actions may **read** `getSkuLanguage()` during `query()`. There is **no** Express `req.skuLanguage` setter (or middleware language slot) for Vite SSR. Sku MUST NOT resolve language from a `:language` route param.

**Out of scope for this decision:** default `VocabProvider` injection, SkuPlugin locale providers, baking SEEK locale composition into sku. The server request entry `language` field is the seam those futures can read later; chunk registration only needs the opaque language name string.

**Why:** Multi-language SEEK apps already depend on language-isolated translation chunks, and their active language is typically a composed locale (`th-TH`), not the URL prefix (`th`). One identification path (server entry) keeps the public API simple. Soft-fail keeps wrong/missing identification from breaking the response.

**Rejected:** Leaving languages/vocab chunk helpers as a post-v1 follow-up. Requiring `addLanguageChunk` on the app API. Encoding SEEK URL→locale composition inside sku. Treating `:language` as an identification path. Route `handle.language`. Middleware `req.skuLanguage` as a parallel identity API for Vite SSR.

### 15. Per-route chunk fixture (required)

**Choice:** In addition to runtime support for RR `lazy` route modules as separate async chunks (decision 7), this change MUST include a fixture that **demonstrates** per-route chunking — at least two lazy route modules that resolve to distinct client chunks and participate in SSR + hydration (assertable via build output and/or network/modulepreload behavior).

**Why:** Incidental lazy-route usage in the main streaming/CSP fixture is not enough to lock the product requirement; a dedicated demo prevents regressions where routes bundle together.

**Rejected:** Treating “fixture mentions lazy routes” as sufficient proof of per-route chunking.

### 16. Server and client request entries

**Choice:** Reuse the existing `serverEntry` / `clientEntry` config keys for optional Vite SSR request hooks. Defaults stay the shared sku defaults (`src/server.tsx` / `src/client.tsx`). Meaning is mode-discriminated: under `bundler: 'vite'` + `renderType: 'server-side-rendered'`, these paths are closed request hooks (below); under webpack SSR / static Vite they keep their existing contracts. Do **not** invent parallel `entryServer` / `entryClient` keys. sku-owned `vite-ssr-server` / `vite-ssr-client` shells import the configured paths when present (same virtual-resolve pattern as `#sku-vite-ssr-app`); missing files → noop.

**Server entry** (`serverEntry`, default `src/server.tsx`):

```ts
export default function onRequest(args: {
  request: Request; // Fetch API Request used for RR query
}): {
  AppWrapper?: ComponentType<{ children: ReactNode }>;
  language?: string; // configured language name, or en-PSEUDO
  clientContext?: JsonValue; // JSON-serialisable shell seed only
};
```

**Client entry** (`clientEntry`, default `src/client.tsx`):

```ts
export default function onHydrate(args: {
  context: JsonValue | undefined; // deserialized clientContext
  language: string | undefined; // forwarded by sku from server result
}): {
  AppWrapper?: ComponentType<{ children: ReactNode }>;
};
```

**Tree:** `Document` → `AppWrapper` (if any) → `StaticRouterProvider` / `RouterProvider`.

**Contracts:**

- **Closed return bag (v1):** only `AppWrapper`, `language`, and `clientContext` on the server; only `AppWrapper` on the client. Grow fields later; do not accept free-form callbacks (no `addLanguageChunk`).
- **`AppWrapper`:** a React component (`ComponentType<{ children }>`) for providers / request-scoped seed — **not** page layout or document chrome. Providers may live in the entry or a separate module. The handler itself is the per-request factory; do not nest a second factory.
- **`language`:** sole app-owned vocab identity path (decision 14). Run the server entry **before** `query()` so the store is seeded for loaders and chunk registration.
- **`clientContext`:** must be JSON-serialisable; serialized into the hydrate bootstrap at **shell time** only. Suspense/content resolved after shell MUST NOT be assumed present. Sku forwards `language` to the client entry **explicitly** (apps need not re-pack it into `clientContext`).
- **Client `AppWrapper`:** hydrate wiring / seed. URL-derived values that change on SPA navigations must re-derive inside the provider (or a route layout); closing only over hydrate `context` will go stale.
- **Fixture:** use the default request-entry paths (`src/server.tsx` / `src/client.tsx`); do not override `serverEntry` / `clientEntry` unless demonstrating a custom path. Consumers may still use `.ts` / `.js` when they configure those paths.

**Why:** One path pair for “server/client entry”; `renderType` already selects the product mode, so parallel config keys only add vocabulary. The Vite SSR **contract** still differs from webpack `renderCallback` / static hydrate — docs must say so clearly. Path strings accept `.ts` / `.tsx` / `.js`; correct stale `.js` defaults in `configuration.md`.

**Rejected:** Separate `entryServer` / `entryClient` config keys. Open-ended “arbitrary per-request code” without a closed return type. Returning `ReactNode` instead of a wrapper component. Placing these handlers on `SkuApp`. Webpack-style `provideClientContext` / `addLanguageChunk` as the primary API. Using request entries to set status/headers or send the document body.

## Risks / Trade-offs

| Risk                                                                 | Mitigation                                                                                      |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Vite SSR + RR Data Mode + document stream integration is non-trivial | Spike: handler → Document stream → hydrate → lazy route → preamble/HMR                          |
| Hydration mismatch on assets/context                                 | Serialize exact asset list used in Document; same tree on client                                |
| Missing preamble breaks HMR                                          | Enforce preamble in sku streaming client wrapper; e2e/dev smoke                                 |
| Shell-only CSP cannot hash late streamed scripts                     | Request a single nonce for React stream scripts when needed; hash known bootstrap bodies        |
| Absolute/`CDN` `publicPath` configured for Vite SSR                  | Config validation rejects with a clear error; docs state relative-only                          |
| Server `Error.stack` leaked via hydration JSON                       | Strip stacks in production bootstrap serialization                                              |
| Dev/prod abort middleware drift writes after disconnect              | Shared HTML middleware; abort-before-write                                                      |
| `actionData` Promises throw during bootstrap stringify               | Promise-scrub loader **and** action data                                                        |
| Manual / derived `moduleId` wrong → missing or wrong preloads        | Conservative matcher (no guessing); never overwrite explicit `moduleId`; dev warn + docs        |
| Language chunk missing / wrong for composed locales                  | Server entry returns `language`; sku registers when known; soft-fail otherwise (decision 14/16) |
| Routes accidentally bundle into one chunk                            | Required per-route chunk fixture + assertions (decision 15)                                     |
| Consumers expect Framework Mode file conventions                     | Docs make Data Mode + sku app export explicit                                                   |
| Middleware writing the body early breaks CSP headers                 | sku owns the HTML response path; middleware must not commit the document body                   |
| Dual maintenance of webpack SSR vs Vite SSR                          | Explicit non-goal to unify; webpack path frozen for this change                                 |
| Consumers keep calling `-ssr` after setting `renderType`             | Clear config-time / command errors pointing to `sku start` / `sku build`                        |
| Loader/action headers (e.g. Set-Cookie) dropped on HTML responses    | Forward `loaderHeaders` / `actionHeaders` before CSP/`Content-Type` (decision 11)               |
| `httpsDevServer: true` with HTTP-only Vite SSR listener              | Shared `createServer` + HMR on the HTTPS server; URL printer stays truthful                     |
| Consumers expect config `devServerMiddleware` on Vite SSR            | Document `SkuApp.middleware` as the Vite SSR path; static `devServerMiddleware` unchanged       |
| Express→Fetch adapter loses array headers / consumed bodies          | Normalize headers; reconstruct body from `req.body` when the stream was already read            |
| Server/client `AppWrapper` trees diverge → hydration mismatch        | Shared provider component; docs: AppWrapper = providers only; same children tree                |
| Client `AppWrapper` stale after SPA navigation                       | Docs: hydrate `context` is seed; URL-derived locale must re-derive on the client                |
| `clientContext` assumes post-shell Suspense data                     | Contract: shell-time JSON only; forward `language` separately (decision 16)                     |
| Locale parsed in middleware for redirects and again in server entry  | Acceptable; middleware must not set a parallel language slot                                    |

## Migration Plan

- Opt-in: set `bundler: 'vite'`, `renderType: 'server-side-rendered'`, and provide the app module
- Optional: provide `serverEntry` / `clientEntry` request hooks for `AppWrapper`, `language`, and `clientContext` (decision 16; same keys/defaults as today, Vite SSR contract)
- Multi-language apps: return `language` from the server entry (do not use middleware `req.skuLanguage` or `:language` for vocab identity)
- Existing webpack SSR: leave `renderType` unset (or `'static-generated'`) and keep `start-ssr` / `build-ssr`
- Static apps: optional explicit `renderType: 'static-generated'`; behavior unchanged
- Streaming apps: replace string document/`#app` hydrate with Document + `hydrateRoot(document)`
- Rollback: remove or change `renderType` / remove app module; webpack SSR unchanged

## Open Questions

Spike open questions are resolved (see Spike Outcomes). Remaining product deferral:

- **Custom logger for setup behaviours?** Should Vite SSR (and/or sku generally) accept a consumer-supplied logger for setup events such as successfully listening on a port? Until decided, production Vite SSR MUST NOT add ad-hoc listen logging; webpack SSR’s console message is not a Vite SSR requirement.

## Spike Outcomes

Validated against [basic-streaming-app-example](https://github.com/jahredhope/basic-streaming-app-example) (Vite `middlewareMode` + `appType: 'custom'`, RR Data Mode `createStaticHandler` → `renderToPipeableStream` → `hydrateRoot(document)`, preamble import, shell CSP headers).

### 1.1–1.3 Viability

- **RR Data Mode + Document stream + document hydrate + lazy route:** Proven. Handler → `StaticRouterProvider` inside Document → pipe on `onShellReady`; client resolves lazy matches then `hydrateRoot(document, …)`.
- **Shell CSP headers + nonce + hashable bootstrap:** Proven. Lazy request-scoped nonce for React stream scripts (include in CSP only if requested); sha256 of exact `bootstrapScriptContent` bodies; HTTP `Content-Security-Policy` set before `pipe(res)`. Dev adds `'unsafe-eval'` + `ws:`/`wss:` for HMR.
- **No `transformIndexHtml`:** Proven. Dev `bootstrapModules`: `@vite/client` + client entry; client entry imports `@vitejs/plugin-react/preamble`; CSS/modulepreloads via Document assets (prod: manifest walk). HMR works without HTML transform.

### 1.4 React version gate

- **React 19:** Emits `<!DOCTYPE html>` when the root is `<html>` — do **not** double-emit a doctype string. Document hydrate is first-class.
- **React 18:** Full-document `hydrateRoot(document)` is not a supported product path for this mode.
- **Decision:** Vite SSR (`renderType: 'server-side-rendered'`) **requires React ≥ 19**. Sku’s workspace catalog already pins React 19; peer range remains `^18 || ^19` for static/webpack consumers. Validate/warn when enabling Vite SSR on React 18.

### 1.5 Open-question resolutions

| Question                | Decision                                                                                                                                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| App module path         | New config `appEntry` (default `src/app.tsx`). Do not reuse `serverEntry` / `renderEntry` / `clientEntry` for the high-level app export.                                                                                                   |
| Request entries         | Reuse `serverEntry` / `clientEntry` (defaults `src/server.tsx` / `src/client.tsx`); Vite SSR closed request-hook contract (decision 16); not `SkuApp` fields; not webpack `renderCallback`. Fixture uses the defaults (no path overrides). |
| Omitted `renderType`    | Treat as today’s static behavior (equivalent to `'static-generated'`). Explicit `'static-generated'` is allowed but optional.                                                                                                              |
| Document ownership      | sku ships and owns the **Document** (assets → CSS + modulepreload). No `SkuApp.document` override in v1; head/SEO via React 19 metadata in routes/layouts. Can add an override later if a consumer requires it.                            |
| Middleware typing       | **Connect `RequestHandler`** on **`SkuApp.middleware`** (Express-compatible). Mount before Vite middlewares + HTML render; must not commit the document body. Config `devServerMiddleware` is static Vite / webpack only.                  |
| `httpsDevServer`        | **Required** for Vite SSR: single-port HTTPS + HMR when enabled (same cert story as other sku commands). Production server stays HTTP.                                                                                                     |
| Loader/action headers   | Forward `loaderHeaders` / `actionHeaders` on streamed document responses (decision 11).                                                                                                                                                    |
| `onAllReady` buffering  | Opt-in via React Router route `handle.waitForAll: true` (deepest/any match). Default remains `onShellReady`.                                                                                                                               |
| Client/asset handoff    | `window.__SKU_DOCUMENT_ASSETS__` + combined hashable `bootstrapScriptContent` (assets + RR hydration payload + serialised `clientContext` / language).                                                                                     |
| Absolute `publicPath`   | **Not supported** for Vite SSR; relative only. CSP uses `'self'` for Document assets.                                                                                                                                                      |
| Hydration safety        | Scrub Promises on loader+action data; strip `Error.stack` in production (decision 10).                                                                                                                                                     |
| Request nonce           | At most one per render, only when requested; CSP `'nonce-…'` only if requested (decision 12); not webpack `createUnsafeNonce`.                                                                                                             |
| Lazy `moduleId`         | Auto-derive from idiomatic `lazy: () => import('…')` (decision 13); manual escape hatch; warn in dev on miss/unknown.                                                                                                                      |
| Vocab language chunks   | Required in v1: build splitting + sku registration; app-owned identification **only** via server entry `language`, then sole-language fallback (decision 14/16). No `:language` / `req.skuLanguage`.                                       |
| Per-route chunk fixture | Required demo of ≥2 distinct lazy route chunks (decision 15).                                                                                                                                                                              |
