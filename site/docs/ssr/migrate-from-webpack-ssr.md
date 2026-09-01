# Migrate from Webpack SSR

> [!CAUTION]
> Experimental — not for production.
> Managed Data Mode SSR is available for evaluation and testing. Do not use it in production yet; the API and behaviour may change.
> In the meantime, continue using [Webpack SSR](./webpack-ssr.md).

High-level guide for moving from **Webpack SSR** (`sku start-ssr` / `sku build-ssr` / `renderCallback`) to Managed Data Mode SSR.

Webpack SSR was lower-level and often required bespoke app behaviour, so migration details will depend on your solution.
For day-to-day API detail, prefer the [Getting started](./) topic pages.

## Requirements

- `bundler: 'vite'` and `buildType: 'ssr'`
- Relative `publicPath` only
- Move off the config [`public`](../configuration.md#public) assets folder — import assets from modules instead
- Drop [`dangerouslySetViteConfig`](../configuration.md#dangerouslysetviteconfig) and [`vitePlugins`](../configuration.md#viteplugins) — unsupported for SSR; raise use-cases via [support](../support.md)
- Treat Jest → [Vitest](../vitest.md) as a prerequisite (`testRunner: 'vitest'`). Prefer a separate PR; use [`@sku-lib/codemod jest-to-vitest`](../vitest.md#migrating-to-vitest)
- Replace webpack `baseUrl: '.'` / bare `src/…` imports with `#` subpath imports via [`pathAliases`](../configuration.md#pathaliases). Run `pnpm dlx @sku-lib/codemod migrate-root-resolution .`

## Config and commands

Replace Webpack SSR scripts and dual-port config with SSR’s single-port shape:

```json
{
  "scripts": {
    "start": "sku start-ssr", // [!code --]
    "start": "sku start", // [!code ++]
    "build": "sku build-ssr", // [!code --]
    "build": "sku build" // [!code ++]
  }
}
```

```ts
import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite', // [!code ++]
  buildType: 'ssr', // [!code ++]
  publicPath: '/',
  port: 3000,
  serverPort: 8001, // [!code --]
} satisfies SkuConfig;
```

- Export `getSite` when more than one site
- **Ports:** Webpack SSR used dual ports (`port` + `serverPort`). Managed Data Mode is single-port — use [`port`](../configuration.md#port) (or `PORT` at runtime). Drop `serverPort`
- **Deploy layout:** `node dist/server/server.js` with sibling `client/` + `server/` — not webpack’s single `dist/server.js`
- Type server-entry `middleware` for Express 4; install React Router 8 in the app

## Routes and request entries

Compose routes with `path` (or `index`) and `lazy` in [`routesEntry`](../configuration.md#routesentry).
Put `loader`, `action`, and `Component` on page modules — see [Routing](./routing.md).
Optional `mapRoutePath` maps one logical path to per-site concrete paths — see [Multi-language](./multi-language.md#maproutepath).

Replace `{ renderCallback, middleware, onStart }` with `defineServerEntry` / `defineClientEntry` — see [Request entries](./entries.md).

Lazy page modules must export a named `Component` (not `export default`).

sku streams the Document — put isomorphic wrapping in the root layout and env-differing values in `getReactContext`.

Map webpack `onStart({ app })` to server-entry [`onListen({ app, httpServer, port })`](./entries.md#onlisten) (bound port + `httpServer` for keep-alive timeouts).

Trust proxy is opt-in via config [`expressTrustProxy`](../configuration.md#expresstrustproxy) (sets hop count `1`), not via `onStart` / `onListen`.
Other trust-proxy values go in `onListen` via `app.set('trust proxy', …)`.

Keep server-only construction in server `getReactContext` (or server-only helpers) and consume via `useReactContext()`.

## App-level providers

Wire [`createSkuContexts`](./providers.md#typed-hooks) — there is no app `Providers` export.

Router-aware wrapping moves into your root layout route.

Vocab: `getLanguage` on the server entry and `VocabProvider` in the root layout — see [Multi-language](./multi-language.md).

**Braid:** add `braid-design-system/reset` to [`entrySideEffects`](../configuration.md#entrysideeffects) — see [Providers → Braid reset](./providers.md#braid-reset).

## Data loading and middleware

Prefer [render-time data loading](./data-loading.md) for page content.
Use loaders for redirects, headers, or waterfalls.

**Apollo:** replace `getDataFromTree` with streaming transport over [`useInsertHtml`](./runtime-api.md#useinserthtml) — see [Apollo streaming hydration](./data-loading.md#apollo-streaming-hydration).

Keep production handlers on server-entry `middleware`; keep local mocks in `devServerMiddleware` — see [Middleware](./middleware.md).

When sibling `client/` is present, production mounts Node static under [`publicPath`](../configuration.md#publicpath) **before** server-entry middleware so catch-all URL-pattern middleware cannot eat hashed assets.
Productionised deploys host those assets outside Node instead.

:::danger Never put Express `req` in `RouterContextProvider`
Prefer values both sides can supply.
Raw `req` is bot available on client navigations — see [Data loading → Router context](./data-loading.md#router-context).
:::

## CSP and hydration

Use header CSP and the single request-scoped nonce (`getCspNonce` / `req.getCspNonce`) — see [CSP](./csp.md).

Drop hand-rolled HTML templates / `getHeadTags` / `getBodyTags`.

Hydration is full-document (`hydrateRoot(document)`), not a partial mount inside markup from `renderCallback`.

## Troubleshooting

If `sku start` fails with React “Element type is invalid … got: object” for a CJS package that still builds in production, see [CJS default-export interop](./troubleshooting.md#cjs-default-export-interop).

## See also

- [Getting started](./) — Managed Data Mode overview
- [Request entries](./entries.md) — `defineServerEntry` / `defineClientEntry`
- [Routing](./routing.md) — route tree and page modules
- [Providers](./providers.md) — typed hooks and Braid reset
- [Data loading](./data-loading.md) — render-time fetch and Apollo
- [Middleware](./middleware.md) — Express vs `devServerMiddleware`
- [Deploy to production](./deploy-to-production.md) — `dist/server` + `dist/client`
- [Webpack SSR](./webpack-ssr.md) — current production path
