# Middleware

> [!CAUTION]
> Experimental — not for production.
> Managed Data Mode SSR is available for evaluation and testing.
> Do not use it in production yet.
> The API and behaviour may change.
> Until then, continue using [Webpack SSR](./webpack-ssr.md).

SSR has three places to run middleware.
Pick the one that matches the job:

1. **[Server `middleware`](#server-entry-middleware)** — production and start.
   Request context before HTML render
2. **[Config `devServerMiddleware`](#dev-only-mocks-devservermiddleware)** — `sku start` only.
   Local mocks and proxies
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

Use this for production request handlers.
Also use it to attach values on `req` that [entry getters](./entries.md) (or server `getRouterContext`) will read.

Do not put raw Express `req` into React Router context.
Project values via dual-entry [`getRouterContext`](./data-loading.md#router-context).

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

`middleware`, the getters, and server `getRouterContext` share that augmentation.

## Dev-only mocks (`devServerMiddleware`)

Use config [`devServerMiddleware`](../configuration.md#devservermiddleware) for local mocks and proxies.
Production never serves those from the Node app.
One example is `/api` traffic that a reverse proxy handles when deployed.
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
That is separate from Express middleware on the server entry.
Use Express for HTTP-level work.
Use route `middleware` for behaviour tied to the matched route tree.

See [Routing → React Router route middleware](./routing.md#react-router-route-middleware) and React Router’s [middleware docs](https://reactrouter.com/how-to/middleware).

## Probe routes

sku serves `GET` and `HEAD /livez` and `GET` and `HEAD /readyz` on `sku start` and the production server.
Both are mounted ahead of request context, static files, Vite, dev server middleware, and your middleware.

`/livez` returns 200 with the body `ok` when the process can run the handler, including while the server is [shutting down](./entries.md#onshutdown).
It does no I/O and calls nothing else.
A stuck event loop fails the probe by timeout.

`/readyz` returns 503 with the body `unavailable` until the server is listening and [`onListen`](./entries.md#onlisten) has returned.
It then returns 200 `ok` until shutdown.
On `SIGTERM` or `SIGINT` it returns 503 immediately.
`/livez` stays 200.

Other methods on `/livez` and `/readyz` return 405 with `Allow: GET, HEAD` and do not reach your middleware.
Other paths, including `/health`, `/healthz`, `/startupz`, `/livez/other`, and `/readyz/other`, still reach your middleware.

Responses use `Content-Type: text/plain; charset=utf-8` and `Cache-Control: no-store`.
Bodies are `ok` or `unavailable`.
sku logs readiness state changes, such as `ready -> draining`, and does not log each probe.
These routes take no app callback.
Use `onListen` for one-time startup work.

## Mount order in production

1. `GET` / `HEAD /livez` and `/readyz` (sku).
   Other methods on those paths return 405.
2. Request-context (sku, CSP nonce store, etc.)
3. `express.static` for client assets under [`publicPath`](../configuration.md#publicpath)
4. Server-entry `middleware` (optional)
5. HTML render

Static mounts **before** server-entry middleware so catch-all URL-pattern handlers cannot intercept hashed client assets under `publicPath`.
App routes outside that prefix still reach middleware and HTML as usual.

## Mount order in `sku start`

1. `GET` / `HEAD /livez` and `/readyz` (sku).
   Other methods on those paths return 405.
2. Request-context (sku, CSP nonce store, etc.)
3. Vite middlewares (HMR / module graph)
4. Config `devServerMiddleware` (optional)
5. Server-entry `middleware`
6. HTML render

Document paths Vite does not handle still reach `devServerMiddleware`, server-entry `middleware`, and HTML.
Dev-only mocks still mount before production middleware so they can intercept traffic that would never reach the app in production.
`sku start` does not mount `express.static` under `publicPath`.
Vite serves the module graph from `/`.
Put anything that must exist in production on the server-entry export.
Keep stubs and local-only routes in `devServerMiddleware`.

## See also

- [Request entries](./entries.md#middleware) — `middleware` on the server entry
- [Data loading](./data-loading.md#router-context) — project Express values into router context
- [Logging](./logging.md) — request access logs via Express middleware
- [Deploy to production](./deploy-to-production.md) — stand-alone vs reverse-proxy asset serving
- [Routing](./routing.md#react-router-route-middleware) — route-level middleware
