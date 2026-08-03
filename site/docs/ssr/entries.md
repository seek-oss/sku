# Request entries

:::danger Experimental — not for production
SSR with Managed Data Mode is available for evaluation and testing. Do not use it in production yet; the API and behaviour may change.
In the meantime, continue using [Webpack SSR](./webpack-ssr.md).
:::

SSR apps have three entry modules:

| Entry  | Default path     | Role                                     |
| ------ | ---------------- | ---------------------------------------- |
| Server | `src/server.tsx` | Per-request server setup                 |
| Client | `src/client.tsx` | Hydrate-time setup                       |
| Routes | `src/routes.tsx` | Route tree — see [Routing](./routing.md) |

Server and client each **`export default`** an object from `defineServerEntry` / `defineClientEntry` (`sku/runtime`).
Prefer `defineClientEntry<typeof server>()({ … })` so client callbacks get typed `Site` / `ClientContext` from the server entry — see [Providers](./providers.md#entry-helpers-and-typing).

## Server entry

Start from the template shape — middleware only is enough for many apps:

```tsx
// src/server.tsx
import { defineServerEntry } from 'sku/runtime';

const server = defineServerEntry({
  middleware: [
    (req, res, next) => {
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

Add getters when you need them.
They run after consumer Express middleware and before React Router handles the document request, in this order: `getSite` → `getLanguage` → `getClientContext` → `getReactContext` → optional `getRouterContext`.

Early getters (`getSite` / `getLanguage` / `getClientContext`) receive `{ req }` (the Express request).
Later getters also receive already-resolved sibling values so you can project instead of re-deriving.

### getSite

Resolves the active site name for this request.
Required when config has more than one site; omit on single-site apps.

```ts
getSite?: (args: { req: ExpressRequest }) => Site;
```

Use [`useSite()`](./providers.md#typed-hooks) in the app.
See [Routing → Multi-site](./routing.md#multi-site-routes).

### getLanguage

Resolves the language for Document vocab chunk registration.

```ts
getLanguage?: (args: { req: ExpressRequest }) => Language;
```

### getClientContext

JSON-serialisable content sent to the client and available via `useClientContext()`.

```ts
getClientContext?: (args: { req: ExpressRequest }) => ClientContext;
```

### getReactContext

Server-specific values for React via `useReactContext()` (for example API clients).

```ts
getReactContext?: (args: {
  req: ExpressRequest;
  site: Site;
  clientContext: ClientContext | undefined;
}) => ReactContext;
```

### middleware

Express middleware run before SSR for each request.
See [Middleware](./middleware.md).

```ts
middleware?: RequestHandler[];
```

### onListen

Called once after middleware + HTML are mounted and `listen` succeeds (both `sku start` and production).
Use it for keep-alive timeouts, readiness logging with the bound port, or rare Express knobs.
Not re-fired on server-entry HMR.
Omit if you do not need a post-listen hook.

For Melways-shaped `trust proxy`, prefer config [`expressTrustProxy`](../configuration.md#expresstrustproxy) (hop count `1`).
Override other trust-proxy values here via `app.set('trust proxy', …)`.

```ts
onListen?: (args: {
  app: Express;
  httpServer: http.Server | https.Server;
  port: number;
}) => void | Promise<void>;
```

```tsx
defineServerEntry({
  onListen({ app, httpServer, port }) {
    httpServer.keepAliveTimeout = 20_000;
    console.log(`listening on ${port}`);
    // rare: app.set('trust proxy', 2)
  },
  // …
});
```

### getRouterContext

Seeds React Router’s `RouterContextProvider` for loader/action DI.
Prefer projecting isomorphic values both server and client can supply — see [Data loading → Router context](./data-loading.md#router-context).

```ts
getRouterContext?: (args: {
  request: Request;
  req: ExpressRequest;
  site: Site;
  clientContext: ClientContext | undefined;
  reactContext: ReactContext | undefined;
}) => RouterContextProvider | Promise<RouterContextProvider>;
```

:::warning Never put Express `req` in `RouterContextProvider`
Project values both sides can supply.
Raw `req` is `undefined` on client navigations.
:::

### Full example

```tsx
// src/server.tsx
import { RouterContextProvider } from 'react-router';
import { defineServerEntry } from 'sku/runtime';

import { userIdContext } from './userIdContext';

const server = defineServerEntry({
  getSite({ req }) {
    return req.get('x-site') === 'nz' ? 'nz' : 'au';
  },
  getLanguage({ req }) {
    return resolveLocaleFromPath(req.path);
  },
  getClientContext({ req }) {
    return {
      theme: 'dark',
      userId: req.user?.id ?? null,
    };
  },
  getRouterContext({ clientContext }) {
    const ctx = new RouterContextProvider();
    ctx.set(userIdContext, clientContext?.userId ?? null);
    return ctx;
  },
  middleware: [
    (req, res, next) => {
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

## Client entry

```tsx
// src/client.tsx
import { defineClientEntry } from 'sku/runtime';

import type server from './server';

const client = defineClientEntry<typeof server>()({
  onHydrate() {
    // Optional hydrate-time side effects (e.g. analytics)
  },
});

export default client;
```

### onHydrate

Side effects before client React hydrate.
Receives `{ clientContext }` from the server seed.
Request values reach React via [providers](./providers.md) — no need to stash them in module state.

```ts
onHydrate?: (args: {
  clientContext: ClientContext | undefined;
}) => void;
```

### getReactContext

Client-specific values for `useReactContext()` (same channel as the server; no Express).

```ts
getReactContext?: (args: {
  site: Site;
  clientContext: ClientContext | undefined;
}) => ReactContext;
```

### getRouterContext

Client seed for loader/action DI.
Called on every client navigation / fetcher — not once at hydrate.
Must work without Express — see [Data loading → Router context](./data-loading.md#router-context).

```ts
getRouterContext?: (args: {
  site: Site;
  clientContext: ClientContext | undefined;
  reactContext: ReactContext | undefined;
}) => RouterContextProvider;
```

### Full example with router context

```tsx
// src/client.tsx
import { RouterContextProvider } from 'react-router';
import { defineClientEntry } from 'sku/runtime';

import type server from './server';
import { userIdContext } from './userIdContext';

const client = defineClientEntry<typeof server>()({
  getRouterContext({ clientContext }) {
    const ctx = new RouterContextProvider();
    ctx.set(userIdContext, clientContext?.userId ?? null);
    return ctx;
  },
});

export default client;
```

## Routes entry

Named export of a React Router route tree — see [Routing](./routing.md).

```ts
export const routes: SkuRouteObject[];
```

`SkuRouteObject` is a React Router `RouteObject` plus optional `sites` for multi-site membership.

## `sku/runtime` helpers

The `sku/runtime` subpath is browser-safe (so webpack / static apps never pull the optional `react-router` peer from the main `sku` entry).

- [`defineServerEntry` / `defineClientEntry`](./providers.md#entry-helpers-and-typing) — entry typing helpers
- [`createSkuContexts`](./providers.md#typed-hooks) — typed `useSite` / `useClientContext` / `useReactContext`
- [`usePreloadRoute`](./routing.md#intent-preloading-with-usepreloadroute) — warm lazy route chunks on intent
- [`useInsertHtml`](#useinserthtml) — queue React nodes into the SSR response stream
- `getCspNonce` — also available from the main `sku` entry

### `useInsertHtml`

Returns `(callback: () => ReactNode) => void`.
During document SSR, sku writes queued nodes into the response stream (first batch before `</head>`, then before later React chunks).
In the browser it is a silent no-op.

Use it for streaming data transports such as Apollo’s `buildManualDataTransport` — see [Apollo streaming hydration](./data-loading.md#apollo-streaming-hydration).

Injected script bodies must carry the [CSP nonce](./csp.md).

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
