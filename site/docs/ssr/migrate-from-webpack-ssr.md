# Migrate from Webpack SSR

High-level guide for moving from **Webpack SSR** (`sku start-ssr` / `sku build-ssr` / `renderCallback`) to **SSR**.

Webpack SSR was lower-level and often required bespoke app behaviour, so migration details will depend on your solution.
For day-to-day API detail, prefer the [Getting started](./) topic pages.

## Requirements

- `bundler: 'vite'` + `buildType: 'ssr'`
- Relative `publicPath` only
- Move off the config [`public`](../configuration.md#public) assets folder — import assets from modules instead
- Drop [`dangerouslySetViteConfig`](../configuration.md#dangerouslysetviteconfig) — unsupported for SSR; raise use-cases via [support](../support.md)
- Treat Jest → [Vitest](../vitest.md) as a prerequisite (`testRunner: 'vitest'`). Prefer a separate PR; use [`@sku-lib/codemod jest-to-vitest`](../vitest.md#migrating-to-vitest)
- Replace webpack `baseUrl: '.'` / bare `src/…` imports with `#` subpath imports via [`pathAliases`](../configuration.md#pathaliases). Run `pnpm dlx @sku-lib/codemod migrate-root-resolution .`

## Config and commands

- Replace `sku start-ssr` / `sku build-ssr` with `sku start` / `sku build`
- Declare non-empty config [`sites`](../configuration.md#sites); export `getSite` when more than one site
- **Ports:** Webpack SSR used dual ports (`port` + `serverPort`). SSR is single-port — use [`port`](../configuration.md#port) (or `PORT` at runtime). Drop `serverPort`
- **Deploy layout:** `node dist/server/server.js` with sibling `client/` + `server/` — not webpack’s single `dist/server.js`
- Type server-entry `middleware` for Express 4; install React Router 8 in the app

## Routes and request entries

- Replace `{ renderCallback, middleware, onStart }` with `defineServerEntry` / `defineClientEntry` — see [Request entries](./entries.md)
- Put routes in [`routesEntry`](../configuration.md#routesentry) with flat `routes` and optional `sites` — see [Routing](./routing.md)
- Lazy page modules must export named `Component` (not `export default`)
- sku streams the Document — put isomorphic wrapping in the root layout and env-differing values in `getReactContext`
- Optional webpack `onStart` is not part of the SSR entry contract
- Keep server-only construction in server `getReactContext` (or server-only helpers) and consume via `useReactContext()`

## App-level providers

- Wire [`createSkuSsrContexts`](./providers.md) — there is no app `Providers` export
- Router-aware wrapping moves into your root layout route
- Vocab: `getLanguage` on the server entry + `VocabProvider` in the root layout — see [Multi-language](./multi-language.md)
- **Braid:** ensure `braid-design-system/reset` runs before any Braid-touching server module — see [Providers](./providers.md)

## Data loading and middleware

- Prefer [render-time data loading](./data-loading.md) for page content; use loaders for redirects, headers, or waterfalls
- Do not put raw Express `req` into `RouterContextProvider`
- **Apollo:** replace `getDataFromTree` with streaming transport over [`useInsertHtml`](./entries.md#useinserthtml) — see [Apollo streaming hydration](./data-loading.md#apollo-streaming-hydration)
- Keep production handlers on server-entry `middleware`; keep local mocks in `devServerMiddleware` — see [Middleware](./middleware.md)

## CSP and hydration

- Use header CSP + the single request-scoped nonce (`getCspNonce` / `req.getCspNonce`) — see [CSP](./csp.md)
- Drop hand-rolled HTML templates / `getHeadTags` / `getBodyTags`
- Hydration is full-document (`hydrateRoot(document)`), not a partial mount inside markup from `renderCallback`

## Troubleshooting

If `sku start` fails with React “Element type is invalid … got: object” for a CJS package that still builds in production, see [CJS default-export interop](./troubleshooting.md#cjs-default-export-interop).
