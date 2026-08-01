# Middleware

SSR has **three middleware layers**:

1. Express HTTP [`middleware`](#server-entry-middleware) — Always runs. Useful for gathering context about a request before render.
2. Express HTTP [`devServerMiddleware`](#config-devservermiddleware-optional-sku-start-only) — Dev server only. Useful for mock APIs and recreating production-like environments.
3. React Router [middleware](./routing.md#react-router-route-middleware) — Useful for content specific behaviour shared across client/server behaviour.

#### Server-entry `middleware` <Badge type="info" text="Optional" />

Runs in start and production.

Export Connect/Express-compatible handlers from the server entry as named `middleware` (`SkuSsrMiddleware`: a handler or array).
Omit the export ⇒ no consumer middleware layer (not an error).
Sku mounts this **before** Vite middlewares and the HTML render path in both `sku start` and the production server.
It must not commit the document body.

SSR runs **Express 4**.
Type `middleware` against Express 4 (`SkuSsrMiddleware` / `@types/express` major 4). This matches the Express major sku depends on for Vite and Webpack SSR server.

Because consumer `middleware` / `devServerMiddleware` mount into sku’s Express app, a future Express **major** upgrade in sku may be a breaking change for SSR apps.
Minor/patch upgrades within the documented major stay non-breaking when APIs remain compatible.

Attach isomorphic-capable values on `req` for [named getters](./entries.md) / optional server [`getRouterContext`](./entries.md#getroutercontext) (e.g. `req.user`).
Augment Express `Request` for those fields — see [Typing middleware-attached fields](./entries.md#typing-middleware-attached-fields-on-req).

Do **not** put raw Express `req` into React Router context — project values via dual-entry [`getRouterContext`](./data-loading.md#router-context-getroutercontext).

```tsx
import type { SkuSsrMiddleware } from 'sku';

export const middleware: SkuSsrMiddleware = (req, res, next) => {
  req.user = { id: '…' }; // after Express Request module augmentation
  if (req.path === '/api/health') {
    res.status(200).type('text/plain').send('ok');
    return;
  }
  next();
};
```

#### Config `devServerMiddleware` (optional; `sku start` only)

Use config [`devServerMiddleware`](../configuration.md#devservermiddleware) for **local mocks and proxies** that production never serves from the Node app (for example `/api` traffic that a reverse proxy handles in deployed environments).
Sku mounts that file only in SSR `sku start`, and **never** imports it into the production server bundle.

In SSR start, the function receives the Express app (same shape as Webpack SSR / `extra-features` docs).
Static Vite apps still receive Vite’s Connect instance — see [Vite → Dev server middleware](../vite.md#dev-server-middleware).

```ts
// sku.config.ts
import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  buildType: 'ssr',
  devServerMiddleware: './dev-middleware.js',
} satisfies SkuConfig;
```

```js
// dev-middleware.js
export default (app) => {
  app.get('/mock-api', (_req, res) => {
    res.status(200).type('text/plain').send('ok');
  });
};
```

#### Mount order in `sku start`

1. Request-context (sku; CSP nonce store, etc.)
2. Config `devServerMiddleware` (optional)
3. Server-entry `middleware`
4. Vite middlewares (HMR / assets)
5. HTML render

Dev mocks mount **before** production middleware so they can intercept traffic that would never reach the app in production.
Put anything that must ship in production on the server-entry export; keep stubs and local-only routes in `devServerMiddleware`.
