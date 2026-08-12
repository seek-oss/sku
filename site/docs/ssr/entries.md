# Request entries

:::danger Experimental — not for production
Managed Data Mode SSR is available for evaluation and testing. Do not use it in production yet; the API and behaviour may change.
In the meantime, continue using [Webpack SSR](./webpack-ssr.md).
:::

SSR apps have three entry modules.
Server and client each **`export default`** an object from `defineServerEntry` / `defineClientEntry`.
Routes export a named `routes` array — see [Routing](./routing.md).

| Entry                   | Default path     | Role                                     |
| ----------------------- | ---------------- | ---------------------------------------- |
| [Server](#server-entry) | `src/server.tsx` | Server setup (onListen, middleware)      |
| [Client](#client-entry) | `src/client.tsx` | Hydrate-time setup                       |
| [Routes](#routes-entry) | `src/routes.tsx` | Route tree — see [Routing](./routing.md) |

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

You’re set up when the file default-exports a `defineServerEntry({ … })` object.

Add getters when you need them.
They run after consumer Express middleware and before React Router handles the document request:

1. `getSite`
2. `getLanguage`
3. `getClientContext`
4. `getReactContext`
5. optional `getRouterContext`

Early getters (`getSite`, `getLanguage`, `getClientContext`) receive `{ req }` (the Express request).
Later getters also receive already-resolved sibling values so you can project instead of re-deriving.

### getSite

Resolves the active site name for this request.
Required when config has more than one site; omit on single-site apps.

```ts
getSite?: (args: { req: ExpressRequest }) => Site;
```

```tsx
getSite({ req }) {
  return req.get('x-site') === 'nz' ? 'nz' : 'au';
},
```

Use [`useSite()`](./providers.md#typed-hooks) in the app.
See [Routing → Multi-site](./routing.md#multi-site-routes).

### getLanguage

Resolves the language for Document vocab chunk registration.
Return a name from config `languages` (or `en-PSEUDO`).

```ts
getLanguage?: (args: { req: ExpressRequest }) => Language;
```

```tsx
getLanguage({ req }) {
  return req.path.startsWith('/th') ? 'th-TH' : 'en';
},
```

See [Multi-language](./multi-language.md).

### getClientContext

JSON-serialisable content sent to the client and available via `useClientContext()`.

```ts
getClientContext?: (args: { req: ExpressRequest }) => ClientContext;
```

```tsx
getClientContext({ req }) {
  return {
    theme: 'dark',
    userId: req.user?.id ?? null,
  };
},
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

Pair with a client `getReactContext` when values differ by environment — see [Providers](./providers.md#pass-values-into-react).

### middleware

Express middleware run before SSR for each request.
See [Middleware](./middleware.md).

```ts
middleware?: RequestHandler[];
```

### onListen

Called once after middleware and HTML are mounted and `listen` succeeds (both `sku start` and production).
Use it for keep-alive timeouts, readiness logging with the bound port, or rare Express knobs.
It is not re-fired on server-entry HMR.
Omit if you do not need a post-listen hook.

For a single reverse-proxy hop, prefer config [`expressTrustProxy`](../configuration.md#expresstrustproxy) (hop count `1`).
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
});
```

### Server entry example

```tsx
// src/server.tsx
import { defineServerEntry } from 'sku/runtime';

const server = defineServerEntry({
  getSite({ req }) {
    return req.get('x-site') === 'nz' ? 'nz' : 'au';
  },
  getLanguage({ req }) {
    return req.path.startsWith('/th') ? 'th-TH' : 'en';
  },
  getClientContext({ req }) {
    return {
      theme: 'dark',
      userId: req.user?.id ?? null,
    };
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

Prefer `defineClientEntry<typeof server>()({ … })` so client callbacks get `Site` / `ClientContext` from the server entry.

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

## Advanced: router context

Optional dual-entry `getRouterContext` seeds React Router’s `RouterContextProvider` for loader/action dependency injection.
Prefer projecting isomorphic values both server and client can supply — see [Data loading → Router context](./data-loading.md#router-context).

### getRouterContext

Server signature — receives Express `req` plus already-resolved sibling values:

```ts
getRouterContext?: (args: {
  request: Request;
  req: ExpressRequest;
  site: Site;
  clientContext: ClientContext | undefined;
  reactContext: ReactContext | undefined;
}) => RouterContextProvider | Promise<RouterContextProvider>;
```

On the **client** entry, the same name is called on every client navigation / fetcher — not once at hydrate.
It must work without Express:

```ts
getRouterContext?: (args: {
  site: Site;
  clientContext: ClientContext | undefined;
  reactContext: ReactContext | undefined;
}) => RouterContextProvider;
```

:::warning Never put Express `req` in `RouterContextProvider`
Prefer values both sides can supply.
Raw `req` is `undefined` on client navigations.
:::

### Router context example

```tsx
// Shared key — src/userIdContext.ts
import { createContext } from 'react-router';

export const userIdContext = createContext<string | null>(null);
```

::: code-group

```tsx [server.tsx]
import { RouterContextProvider } from 'react-router';
import { defineServerEntry } from 'sku/runtime';

import { userIdContext } from './userIdContext';

const server = defineServerEntry({
  getClientContext({ req }) {
    return { userId: req.user?.id ?? null };
  },
  getRouterContext({ clientContext }) {
    const ctx = new RouterContextProvider();
    ctx.set(userIdContext, clientContext?.userId ?? null);
    return ctx;
  },
});

export default server;
```

```tsx [client.tsx]
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

:::

## Routes entry

Named export of a React Router route tree — see [Routing](./routing.md).

```ts
import type { MapRoutePath, SkuRouteObject } from 'sku/runtime';

export const routes: SkuRouteObject[];
export const mapRoutePath?: MapRoutePath;
```

`SkuRouteObject` is a React Router `RouteObject` plus optional `sites` for multi-site membership.

Optional `mapRoutePath` clones path-bearing and index routes for alternate paths (index homes use `path: ''`) — see [Multi-language](./multi-language.md#maproutepath).

## See also

- [Routing](./routing.md) — compose the route tree
- [Providers](./providers.md) — typed hooks and root layout
- [Middleware](./middleware.md) — Express and `devServerMiddleware`
- [Data loading](./data-loading.md) — render-time fetch and loaders
- [Logging](./logging.md) — `instrumentations` on each entry
- [Runtime API](./runtime-api.md) — `sku/runtime` helpers
