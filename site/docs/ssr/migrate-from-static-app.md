# Migrate from Static App

High-level guide for moving a **static** sku app (webpack or Vite SSG) to SSR.
For day-to-day API detail, prefer the [Server rendering](./) topic pages (routing, entries, providers, and so on).

## Requirements

- SSR is Vite-only: `bundler: 'vite'` + `buildType: 'ssr'`
- Use a **relative** `publicPath` (e.g. `/`) — absolute / CDN URLs are not supported
- Move off the config [`public`](../configuration.md#public) assets folder before adopting SSR — if that directory exists, `sku start` / `sku build` fail. Import assets from modules instead
- Drop [`dangerouslySetViteConfig`](../configuration.md#dangerouslysetviteconfig) — unsupported for SSR (hard-error when set); raise use-cases via the [support page]

## Limitations

This guide covers the **sku** surface only (config, entries, providers, middleware, CSP, headers, hydration).
Infrastructure, deployments, process managers, and reverse-proxy setup are out of scope.

## Config and commands

- Set `bundler: 'vite'` and `buildType: 'ssr'`
- Prefer scaffolding with `pnpm dlx @sku-lib/create my-app --template vite-ssr`, or mirror that config
- Use `sku start` / `sku build` (same commands as Static) — do **not** introduce `start-ssr` / `build-ssr`
- Drop static-only config such as `renderEntry` / `src/render.tsx` and environments-driven static HTML generation for the SSR path
- Remove or empty the [`public`](../configuration.md#public) assets folder and import those files from modules (SSR does not copy/serve that folder)
- Remove [`dangerouslySetViteConfig`](../configuration.md#dangerouslysetviteconfig) (hard-error for SSR; raise exceptional needs via the [support page])

## Routes and request entries

- Replace the static page + `render.tsx` / `#app` client with config [`routesEntry`](../configuration.md#routesentry) exporting named `routes` (`SkuSsrRouteObject[]`; optional `sites` for multi-site)
- Return required `site` from `onRequest` (must be a configured config `sites` name; single-site apps declare e.g. `sites: ['default']` and return that name)
- Add required named `onRequest`, `middleware`, and `onHydrate` on the request entries (hard error if missing) — do **not** re-export `routes` from `serverEntry` / `clientEntry`
- Prefer idiomatic `lazy: () => import('./pages/…')` on route configs for per-route chunks
- Lazy page modules must export named `Component` (not `export default`) for React Router Data Mode

## App-level providers

- Move app-wide dependencies (Braid, API clients, etc.) into a named `Providers` export on `serverEntry` / `clientEntry` — not into a static `renderApp` / `#app` tree alone
- `Providers` render **outside** the router, so they cannot use React Router hooks. Router-aware wrapping (Vocab keyed on the URL, page chrome) belongs in your own root layout route in `routesEntry` — see [Providers](./providers.md)
- Request-scoped values arrive as `Providers` props (`site`, `clientContext`), or via [`getContext`](./data-loading.md#router-context-getcontext) for loader/action DI — no ALS helpers or module-level state needed
- Server and client `Providers` may differ, so they must render identical DOM; prefer context-only providers (sku warns in development when they emit markup)
- Inject env-specific API / Experience clients via `Providers` for [render-time data loading](./data-loading.md)

## Data loading

- Prefer render-time fetching in React (named `Providers` export + Suspense / shared clients) for page content — see [Data loading](./data-loading.md)
- Use React Router loaders when you need to avoid a deeply nested waterfall, issue a document `redirect()`, set response headers, or opt-in dual-entry [`getContext`](./data-loading.md#router-context-getcontext) DI
- `onRequest` receives Express `{ req }` only (not Fetch `Request`) — see [Request entries](./entries.md#onrequest)
- Loaders receive a Fetch `Request`, not Express `req` — use dual-entry `getContext` to project isomorphic values for loader DI; never put raw `req` in `RouterContextProvider`

## Middleware

- Mount production Connect/Express middleware on the server entry `middleware` export (required; empty / passthrough OK)
- Keep local-only mocks/proxies in optional config [`devServerMiddleware`](../configuration.md#devservermiddleware) — mounted in `sku start` only, never in the production server bundle
- React Router route `middleware` on `RouteObject`s is a separate layer — see [Middleware](./middleware.md)

See [Middleware](./middleware.md) for the two-layer HTTP split and start mount order.

## CSP

- Enable `cspEnabled` / `cspReportOnlyEnabled` as needed — SSR emits **HTTP header** CSP, not meta `http-equiv` — see [CSP](./csp.md)
- Use the single request-scoped nonce (`getCspNonce` / `req.getCspNonce`); do not carry over static/webpack multi-`createUnsafeNonce` patterns

## Response headers

- When you need `Cache-Control`, `Set-Cookie`, etc. on the document response, set them from React Router loaders/actions; sku forwards those headers onto streamed HTML responses — see [Response headers](./data-loading.md#response-headers)
- Do not expect a consumer `renderDocument` / `res.send` HTML path

## Document / hydration

- Replace `#app` `hydrateRoot` and `renderDocument` with sku’s full-document stream + `hydrateRoot(document)` — see [Document hydration](./entries.md#document-hydration)
- Use React document metadata in routes/layouts for head/SEO; the Document shell is not overridable

[support page]: /support
