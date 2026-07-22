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
- Replace `sku start-ssr` / `sku build-ssr` with `sku start` / `sku build`
- **Ports:** Webpack SSR used dual ports (`port` for assets + `serverPort` for the Node app). SSR is **single-port**: use [`port`](../configuration.md#port) for `sku start` and the baked production default (`PORT` still overrides at runtime). Drop `serverPort` — providing it with SSR fails validation. If you previously listened on `serverPort` in production, set that value as `port` (or keep using `PORT` in deploy).
- **Deploy layout:** production entry is `node dist/server/server.js` with sibling `client/` + `server/` under the build target — not webpack’s single `dist/server.js` layout
- `buildType` set means `-ssr` commands are rejected
- Type server-entry `middleware` for **Express 4** (`SkuSsrMiddleware` / `@types/express` major 4)
- Type routes / Data Mode APIs for **React Router 8** (optional peer `react-router@^8`; install it in the app)
- Drop the [`public`](../configuration.md#public) assets folder (and any `public: '…'` path that still exists on disk); import those assets from modules
- Remove [`dangerouslySetViteConfig`](../configuration.md#dangerouslysetviteconfig) (hard-error for SSR; raise exceptional needs via the [support page])

## Routes and request entries

- Replace webpack `serverEntry` default export `{ renderCallback, middleware, onStart }` with SSR named exports: `routes` on **both** server and client entries, plus server `onRequest` + `middleware`, client `onHydrate`
- Prefer a shared `createRoutes(...)` factory so server/client trees stay hydration-compatible
- Lazy page modules must export named `Component` (not `export default`)
- Express `renderCallback` no longer owns HTML — sku streams Document; put providers in `AppWrapper`
- Optional webpack `onStart` is not part of the SSR request-entry contract
- **Server-only modules:** Server-only content should be imported in serverEntry and passed through to your app via AppWrapper Providers. Avoid server-side only implementations being imported outside serverEntry, shared code will be loaded by the client and available for public access.
- When the lazy factory is no longer a bare `() => import('./home')`, set [`handle.moduleId`](./routing.md#lazy-routes-and-handlemoduleid) explicitly so production modulepreloads still work.

## App-level providers

- Move `SkuProvider` / app providers from `renderCallback` into `AppWrapper` on `onRequest` / `onHydrate`
- Inject env-specific API / Experience clients via `AppWrapper` for [render-time data loading](./data-loading.md) (prefer this over loaders for page content)
- Vocab language identity moves from `addLanguageChunk` / path hacks to server entry `language` (see [Multi-language](./multi-language.md))
- **Braid:** ensure `braid-design-system/reset` runs before any Braid-touching **server** module on `sku start` (evaluation order can differ from production). Sku does not auto-inject reset — see [App Wrapper / Providers](./providers.md)
- **`window` providers:** keep analytics / other `window`-constructing providers out of the Document SSR tree — client-only wrappers or `onHydrate`-only `AppWrapper` (see [App Wrapper / Providers](./providers.md))

## Data loading

- Prefer render-time fetching in React (`AppWrapper` + Suspense / shared clients) for page content — not React Router loaders as the default — see [Data loading](./data-loading.md)
- Use loaders when you need to avoid a deeply nested waterfall, issue a document `redirect()`, or set response headers
- Loaders receive a Fetch `Request`, **not** Express `req`. Sku does **not** bridge Express middleware-attached state into loaders. If your app depends on that coupling for page data, stay on Webpack SSR for now and raise with sku-support

## Middleware

- Keep using a middleware export, but on the SSR **server entry** named `middleware` (same Connect style; required export, empty / passthrough OK)
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
