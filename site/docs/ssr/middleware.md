# Middleware

> [!CAUTION]
> Experimental — not for production.
> Managed Data Mode SSR is available for evaluation and testing. Do not use it in production yet; the API and behaviour may change.
> In the meantime, continue using [Webpack SSR](./webpack-ssr.md).

SSR has three places to run middleware — pick the one that matches the job:

1. **[Server `middleware`](#server-entry-middleware)** — production and start; request context before HTML render
2. **[Config `devServerMiddleware`](#dev-only-mocks-devservermiddleware)** — `sku start` only; local mocks and proxies
3. **[React Router middleware](#react-router-route-middleware)** — isomorphic behaviour on matched routes

## Server-entry middleware

Export Connect/Express handlers from the server entry.
sku mounts them before the HTML render path in both `sku start` and production.

```tsx
// src/server.tsx
import { defineServerEntry } from 'sku/runtime';

const server = defineServerEntry({
  middleware: [
    (req, res, next) => {
      req.user = { id: '…' }; // after Express Request module augmentation
      if (req.path === '/api/health') {
        res.status(200).type('text/plain').send('ok');
        return;
      }
      next();
    },
  ],
});

export default server;
```

Use this for production request handlers and for attaching values on `req` that [entry getters](./entries.md) (or server `getRouterContext`) will read.

Do not put raw Express `req` into React Router context — project values via dual-entry [`getRouterContext`](./data-loading.md#router-context).

## Typing middleware-attached fields on `req`

Fields you append in middleware (`req.user`, `req.log`, …) are not on Express’s stock `Request` type.
Augment Express the same way sku does for `getCspNonce`.

Install `@types/express-serve-static-core` as a direct dependency, then:

```ts
// e.g. src/types/express.d.ts (ensure included by tsconfig)
declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: string };
    log?: { info: (msg: string) => void };
  }
}
```

That augmentation is shared by `middleware`, the getters, and server `getRouterContext`.

## Dev-only mocks (`devServerMiddleware`)

Use config [`devServerMiddleware`](../configuration.md#devservermiddleware) for local mocks and proxies that production never serves from the Node app (for example `/api` traffic a reverse proxy handles when deployed).
sku mounts that file only in SSR `sku start`, never in the production server.

::: code-group

```ts [sku.config.ts]
import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  buildType: 'ssr',
  devServerMiddleware: './dev-middleware.js',
} satisfies SkuConfig;
```

```js [dev-middleware.js]
export default (app) => {
  app.get('/mock-api', (_req, res) => {
    res.status(200).type('text/plain').send('ok');
  });
};
```

:::

## React Router route middleware

React Router Data Mode supports a `middleware` array on routes for isomorphic behaviour on matched routes.
That is separate from Express middleware on the server entry — use Express for HTTP-level work, and route `middleware` for behaviour tied to the matched route tree.

See [Routing → React Router route middleware](./routing.md#react-router-route-middleware) and React Router’s [middleware docs](https://reactrouter.com/how-to/middleware).

## Mount order in production

1. Request-context (sku; CSP nonce store, etc.)
2. `express.static` for client assets under [`publicPath`](../configuration.md#publicpath)
3. Server-entry `middleware` (optional)
4. HTML render

Static mounts **before** server-entry middleware so catch-all URL-pattern handlers cannot eat hashed client assets under `publicPath`.
App routes outside that prefix still reach middleware and HTML as usual.

## Mount order in `sku start`

1. Request-context (sku; CSP nonce store, etc.)
2. Config `devServerMiddleware` (optional)
3. Server-entry `middleware`
4. Vite middlewares (HMR / assets)
5. HTML render

Dev-only mocks mount before production middleware so they can intercept traffic that would never reach the app in production.
`sku start` does not mount `express.static` under `publicPath` — Vite serves the module graph from `/`.
Put anything that must ship in production on the server-entry export; keep stubs and local-only routes in `devServerMiddleware`.

## See also

- [Request entries](./entries.md#middleware) — `middleware` on the server entry
- [Data loading](./data-loading.md#router-context) — project Express values into router context
- [Logging](./logging.md) — request access logs via Express middleware
- [Deploy to production](./deploy-to-production.md) — stand-alone vs reverse-proxy asset serving
- [Routing](./routing.md#react-router-route-middleware) — route-level middleware
