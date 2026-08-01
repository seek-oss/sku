# Migrate from Webpack SSR

High-level guide for moving from **Webpack SSR** (`sku start-ssr` / `sku build-ssr` / `renderCallback`) to **SSR**.

Webpack SSR was significantly lower-level and required apps to introduce a lot of their own bespoke behaviour.
Because of this, migration will likely be dependent on your solution’s specifics.

## Requirements

- Switch to `bundler: 'vite'` + `buildType: 'ssr'`
- Relative `publicPath` only
- Move off the config [`public`](../configuration.md#public) assets folder — SSR hard-errors if that directory exists; import assets from modules instead
- Drop [`dangerouslySetViteConfig`](../configuration.md#dangerouslysetviteconfig) — unsupported for SSR (hard-error when set); raise use-cases via the [support page]
- **Tests:** treat Jest → [Vitest](../vitest.md) as an SSR prerequisite (`testRunner: 'vitest'`). Prefer a separate PR; use [`@sku-lib/codemod jest-to-vitest`](../vitest.md#migrating-to-vitest) plus the Vitest checklist there (mock shapes, RTL, platform singletons). No additional Jest→Vitest codemod ships with this mode.
- **Imports:** webpack `baseUrl: '.'` / bare `src/…` imports are not SSR path aliases — use `#` subpath imports via [`pathAliases`](../configuration.md#pathaliases). Run `pnpm dlx @sku-lib/codemod migrate-root-resolution .` (see the [sku changelog](https://github.com/seek-oss/sku/blob/master/packages/sku/CHANGELOG.md) guidance for `rootResolution` → `#src/…`)

## Limitations

Covers the **sku** migration surface only.
Deploy/process/infra changes are out of scope beyond noting command and layout differences.

## Config and commands

- Set `buildType: 'ssr'` and `bundler: 'vite'`
- Declare non-empty config [`sites`](../configuration.md#sites) (≥1 site name); export sync `getSite` when more than one site (omit on single-site)
- Replace `sku start-ssr` / `sku build-ssr` with `sku start` / `sku build`
- **Ports:** Webpack SSR used dual ports (`port` for assets + `serverPort` for the Node app). SSR is **single-port**: use [`port`](../configuration.md#port) for `sku start` and the baked production default (`PORT` still overrides at runtime). Drop `serverPort` — providing it with SSR fails validation. If you previously listened on `serverPort` in production, set that value as `port` (or keep using `PORT` in deploy).
- **Deploy layout:** production entry is `node dist/server/server.js` with sibling `client/` + `server/` under the build target — not webpack’s single `dist/server.js` layout
- `buildType` set means `-ssr` commands are rejected
- Type server-entry `middleware` for **Express 4** (`SkuSsrMiddleware` / `@types/express` major 4)
- Type routes / Data Mode APIs for **React Router 8** (optional peer `react-router@^8`; install it in the app)
- Drop the [`public`](../configuration.md#public) assets folder (and any `public: '…'` path that still exists on disk); import those assets from modules
- Remove [`dangerouslySetViteConfig`](../configuration.md#dangerouslysetviteconfig) (hard-error for SSR; raise exceptional needs via the [support page])

## Routes and request entries

- Replace webpack `serverEntry` default export `{ renderCallback, middleware, onStart }` with SSR default-exported entry objects via `defineServerEntry` / `defineClientEntry`: sync getters (`getSite` / `getLanguage` / `getClientContext` / `getReactContext`), optional `middleware`, optional client `onHydrate`
- Use optional `sites` for membership when paths differ by site
- Multi-site path sets use `routesEntry` + `routes` + optional `sites` + `getSite` (not optional language path params, union tree + allowlist, `routesBySite` maps, dual-entry `routes` re-exports, or sku config host matching) — see [Routing](./routing.md#multi-site-path-sets)
- Lazy page modules must export named `Component` (not `export default`)
- Express `renderCallback` no longer owns HTML — sku streams Document; put isomorphic wrapping in the root layout and env-differing values in `getReactContext`
- Optional webpack `onStart` is not part of the SSR request-entry contract
- **Server-only modules:** import server-only construction in `serverEntry` `getReactContext` (or server-only helpers) and consume via `useReactContext()` in the root layout. Avoid server-side only implementations being imported outside serverEntry — shared code will be loaded by the client and available for public access.
- When the lazy factory is no longer a bare `() => import('./home')`, set [`handle.moduleId`](./routing.md#lazy-routes-and-handlemoduleid) explicitly so production modulepreloads still work.

## App-level providers

- Wire [`createSkuSsrContexts`](./providers.md) — sku always mounts `SkuSsrProvider`; there is no app `Providers` export
- Router-aware wrapping moves into your own root layout route in `routesEntry` — see [Providers](./providers.md)
- Request-scoped values arrive via sku hooks (`useSite` / `useClientContext` / `useReactContext`) or [`getRouterContext`](./data-loading.md#router-context-getroutercontext)
- Inject env-specific API / Experience clients via dual-entry `getReactContext` for [render-time data loading](./data-loading.md) (prefer this over loaders for page content)
- Vocab language identity moves from `addLanguageChunk` / path hacks to server entry `getLanguage` (see [Multi-language](./multi-language.md)); the `VocabProvider` itself goes in your root layout route so it tracks client navigation
- **Braid:** ensure `braid-design-system/reset` runs before any Braid-touching **server** module on `sku start` (evaluation order can differ from production). Sku does not auto-inject reset — see [Providers](./providers.md)
- **`window` libraries:** put construction in client `getReactContext` and consume from the root layout / `useEffect` — see [Providers](./providers.md)

## Data loading

- Prefer render-time fetching in React (`getReactContext` + root-layout providers + Suspense) for page content — not React Router loaders as the default — see [Data loading](./data-loading.md)
- Use loaders when you need to avoid a deeply nested waterfall, issue a document `redirect()`, set response headers, or opt-in dual-entry [`getRouterContext`](./data-loading.md#router-context-getroutercontext) DI
- Loaders receive a Fetch `Request`, **not** Express `req`. Express `req` is available to [entry getters](./entries.md) and optional server `getRouterContext` — not as the loader `request` argument
- **Do not** put raw Express `req` into `RouterContextProvider` — project isomorphic values via dual-entry `getRouterContext` (see the [red warning](./data-loading.md#router-context-getroutercontext))
- Type middleware-appended `req` fields with Express `Request` module augmentation — see [Request entries](./entries.md#typing-middleware-attached-fields-on-req)
- **Apollo:** drop two-pass `getDataFromTree` — replace it with a streaming transport over [`useInsertHtml`](./entries.md#useinserthtml), dual-entry `getReactContext` for `makeClient` / server nonce `extraScriptProps`, and an isomorphic provider in the root layout via `useReactContext()`. Loader-transported query refs are unsupported — see [Apollo streaming hydration](./data-loading.md#apollo-streaming-hydration)

## Middleware

- Keep using a middleware export, but on the SSR **server entry** named `middleware` (same Connect style; optional — omit for no consumer middleware layer)
- Move local-only mocks/proxies that webpack put in `devServerMiddleware` (or only ran under `start-ssr`) to the same config key — SSR still mounts it in `sku start` only and keeps it out of the production server
- React Router route `middleware` on `RouteObject`s is separate from Express/Connect `middleware` — see [Middleware](./middleware.md)
- Webpack dual-port / proxy assumptions differ; SSR is single-port (`port` only; `httpsDevServer` supported). Revisit auth redirects and proxy targets that assumed a separate asset origin on `port`

See [Middleware](./middleware.md) for mount order.

## CJS interop

- If `sku start` fails with React “Element type is invalid … got: object” for a CJS package that still builds in production, extend [`__UNSAFE_EXPERIMENTAL__cjsInteropDependencies`](../configuration.md#__unsafe_experimental__cjsinteropdependencies) — see [CJS default-export interop](./troubleshooting.md#cjs-default-export-interop)

## CSP

- Leave meta `http-equiv` / multi-`createUnsafeNonce` webpack patterns behind
- Use header CSP + the single request-scoped nonce APIs (`getCspNonce` / `req.getCspNonce`) — see [CSP](./csp.md)

## Response headers

- When you need `Set-Cookie`, `Cache-Control`, etc. on the document response, use loader/action headers — see [Response headers](./data-loading.md#response-headers)
- sku forwards loader/action headers onto the streamed HTML response

## Document / hydration

- Drop hand-rolled HTML templates / `getHeadTags` / `getBodyTags` document assembly for the SSR path
- Hydration is full-document (`hydrateRoot(document)`), not a partial mount inside markup you assembled in `renderCallback` — see [Document hydration](./entries.md#document-hydration)

[support page]: /support
