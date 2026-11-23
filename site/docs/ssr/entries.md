# Request entries

> [!CAUTION]
> Experimental — not for production.
> Managed Data Mode SSR is available for evaluation and testing.
> Do not use it in production yet.
> The API and behaviour may change.
> Until then, use [Webpack SSR](./webpack-ssr.md).

SSR apps have three entry modules.
The server and client each **`export default`** an object from `defineServerEntry` / `defineClientEntry`.
Routes export a named `routes` array.
See [Routing](./routing.md).

| Entry                   | Default path     | Role                                                    |
| ----------------------- | ---------------- | ------------------------------------------------------- |
| [Server](#server-entry) | `src/server.tsx` | Server configuration (onListen, onShutdown, middleware) |
| [Client](#client-entry) | `src/client.tsx` | Hydrate-time configuration                              |
| [Routes](#routes-entry) | `src/routes.tsx` | Route tree — see [Routing](./routing.md)                |

## Server entry

Start from the template shape.
Middleware alone is enough for many apps:

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

The server entry is complete when the file default-exports a `defineServerEntry({ … })` object.

Add getters when you need them.
They run after consumer Express middleware and before React Router handles the document request:

1. [`getSite`](#getsite)
2. [`getLanguage`](#getlanguage)
3. [`getClientContext`](#getclientcontext)
4. [`getReactContext`](#getreactcontext)
5. optional [`getRouterContext`](#getroutercontext)

See [Data loading → Three value channels](./data-loading.md#three-value-channels) for which channel to use.

Early getters (`getSite`, `getLanguage`, `getClientContext`) receive `{ req }` (the Express request).
Later getters also receive sibling values that sku already resolved.
You can derive from those values instead of computing them again.

### getSite

`getSite` resolves the active site name for this request.
Provide `getSite` when config has more than one site.
Omit it on single-site apps.

```ts
type ServerEntry = {
  getSite?: (args: { req: ExpressRequest }) => Site;
};
```

```tsx
defineServerEntry({
  getSite({ req }) {
    return req.get('x-site') === 'nz' ? 'nz' : 'au';
  },
});
```

Use [`useSite()`](./providers.md#typed-hooks) in the app.
See [Routing → Multi-site](./routing.md#multi-site-routes).

### getLanguage

`getLanguage` resolves the language for Document vocab chunk registration.
Return a name from config `languages` (or `en-PSEUDO`).

```ts
type ServerEntry = {
  getLanguage?: (args: { req: ExpressRequest }) => Language;
};
```

```tsx
defineServerEntry({
  getLanguage({ req }) {
    return req.path.startsWith('/th') ? 'th-TH' : 'en';
  },
});
```

See [Multi-language](./multi-language.md).

### getClientContext

`getClientContext` returns JSON-serialisable content.
sku sends it to the client.
Read it with [`useClientContext()`](./providers.md#typed-hooks).
See [Three value channels](./data-loading.md#three-value-channels) for serialisation and nested `undefined` rules.

```ts
type ServerEntry = {
  getClientContext?: (args: {
    req: ExpressRequest;
  }) => ClientContext | Promise<ClientContext>;
};
```

```tsx
defineServerEntry({
  getClientContext({ req }) {
    return {
      theme: 'dark',
      userId: req.user?.id ?? null,
    };
  },
});
```

### getReactContext

`getReactContext` returns server-specific values for React.
Read them with [`useReactContext()`](./providers.md#typed-hooks).
Examples include API clients.

```ts
type ServerEntry = {
  getReactContext?: (args: {
    req: ExpressRequest;
    site: Site;
    clientContext: ClientContext | undefined;
  }) => ReactContext | Promise<ReactContext>;
};
```

Pair with a client `getReactContext` when values differ by environment.
See [Providers](./providers.md#pass-values-into-react) and [Three value channels](./data-loading.md#three-value-channels).

### middleware

`middleware` is Express middleware.
sku runs it before SSR for each request.
See [Middleware](./middleware.md).

```ts
type ServerEntry = {
  middleware?: RequestHandler[];
};
```

### onListen

sku calls `onListen` once after it mounts middleware and HTML, and after `listen` succeeds (both `sku start` and production).
Use it for readiness logging with the bound port, a longer keep-alive, or rare Express settings.
sku does not call it again on server-entry HMR.
Omit it if you do not need a post-listen hook.

Production sets `keepAliveTimeout` to 35 seconds before `onListen`.
`sku start` does not set keep-alive.
You can replace the production timeout here.

Set keep-alive above the idle timeout of the proxy in front of the app.
For a proxy that idles out at 60 seconds:

```tsx
import { defineServerEntry } from 'sku/runtime';

defineServerEntry({
  onListen({ httpServer }) {
    httpServer.keepAliveTimeout = 65_000;
  },
});
```

`headersTimeout` does not need to be above `keepAliveTimeout`.
It only limits how long a client can take to send request headers, and does not apply to an idle keep-alive connection.

For a single reverse-proxy hop, prefer config [`expressTrustProxy`](../configuration.md#expresstrustproxy) (hop count `1`).
Override other trust-proxy values here via `app.set('trust proxy', …)`.

```ts
type ServerEntry = {
  onListen?: (args: {
    app: Express;
    httpServer: http.Server | https.Server;
    port: number;
  }) => void | Promise<void>;
};
```

### onShutdown

Production registers one `SIGTERM` listener after `onListen` returns.
`sku start` does not.
On `SIGTERM`, production stops accepting connections, closes sockets that have no in-flight response, lets in-flight responses finish, closes their sockets, awaits `onShutdown`, and exits 0.
If shutdown has not finished 25 seconds after `SIGTERM`, the process exits 1 and `onShutdown` does not run.
Those 25 seconds assume a platform grace period of 30 seconds.
sku calls `process.exit`, so `beforeExit` handlers do not run.

`onShutdown` takes no arguments and may return a promise.
Do not call `process.exit` from it.
Omitting it is fine.

sku does not start or flush telemetry.
Start the clients you use when the server entry loads, and flush them from `onShutdown`.
See [Logging → Shutdown](./logging.md#shutdown).

Do not register a `SIGTERM` listener.
Production startup fails when one already exists.
That includes a listener your tracing setup registered, and one a dependency registered (for example through `signal-exit`).
The OpenTelemetry Node SDK sample registers `SIGTERM` and then calls `process.exit`.
Delete that listener and call `shutdown()` from `onShutdown` instead.

For a listener a dependency registered, use the dependency's own way to turn off its signal handling, such as a config option or a function that removes its listener.
Call that in `onListen`, or when you set up the dependency, and call the dependency's shutdown or close from `onShutdown`.
Removing the listener behind the dependency's back can leave it thinking its handler is still installed.

If the dependency has no way to turn it off, remove every `SIGTERM` listener in `onListen`.
sku registers its own listener after `onListen` returns, so this does not remove it.

```ts
import { defineServerEntry } from 'sku/runtime';

const server = defineServerEntry({
  onListen() {
    // Only when the dependency has no option or function to remove its listener.
    process.removeAllListeners('SIGTERM');
  },
  onShutdown() {
    // Call the dependency's own shutdown or close here.
  },
});

export default server;
```

```ts
type ServerEntry = {
  onShutdown?: () => void | Promise<void>;
};
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

Run side effects before the client hydrates React.
`onHydrate` receives `{ clientContext }` from the server seed.
Request values reach React via [providers](./providers.md).
You do not need to store them in module state.

```ts
type ClientEntry = {
  onHydrate?: (args: { clientContext: ClientContext | undefined }) => void;
};
```

### getReactContext

`getReactContext` returns client-specific values for `useReactContext()`.
It uses the same channel as the server.
It has no Express request.

```ts
type ClientEntry = {
  getReactContext?: (args: {
    site: Site;
    clientContext: ClientContext | undefined;
  }) => ReactContext | Promise<ReactContext>;
};
```

## Advanced: router context

Optional dual-entry `getRouterContext` seeds React Router’s `RouterContextProvider`.
Use it to inject dependencies into loaders, actions, and route middleware.
Prefer to derive isomorphic values that both server and client can supply.
See [Data loading → Router context](./data-loading.md#router-context) and [Three value channels](./data-loading.md#three-value-channels).

### getRouterContext

The server signature receives Express `req` plus sibling values that sku already resolved:

```ts
type ServerEntry = {
  getRouterContext?: (args: {
    request: Request;
    req: ExpressRequest;
    site: Site;
    clientContext: ClientContext | undefined;
    reactContext: ReactContext | undefined;
  }) => RouterContextProvider | Promise<RouterContextProvider>;
};
```

On the **client** entry, sku calls the same name on every client navigation and fetcher.
It does not call it only once at hydrate.
It must work without Express:

```ts
type ClientEntry = {
  getRouterContext?: (args: {
    site: Site;
    clientContext: ClientContext | undefined;
    reactContext: ReactContext | undefined;
  }) => RouterContextProvider | Promise<RouterContextProvider>;
};
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

The routes entry is a named export of a React Router route tree.
See [Routing](./routing.md).

```ts
import type { MapRoutePath, SkuRouteObject } from 'sku/runtime';

export type RoutesEntry = {
  routes: SkuRouteObject[];
  mapRoutePath?: MapRoutePath;
};
```

`SkuRouteObject` is a React Router `RouteObject` plus optional `sites` for multi-site membership.

Optional `mapRoutePath` clones path-bearing routes and index routes for alternate paths.
Index homes use `path: ''`.
See [Multi-language](./multi-language.md#maproutepath).

## See also

- [Routing](./routing.md) — compose the route tree
- [Providers](./providers.md) — typed hooks and root layout
- [Middleware](./middleware.md) — Express and `devServerMiddleware`
- [Data loading](./data-loading.md) — render-time data loading and loaders
- [Logging](./logging.md) — `instrumentations` on each entry, and flushing clients from `onShutdown`
- [Runtime API](./runtime-api.md) — `sku/runtime` helpers
