# Request entries

sku SSR uses three entry modules:

[serverEntry](#server-entry) (default: `src/server.tsx`) — entrypoint for server-side request lifecycle.

[clientEntry](#client-entry) (default: `src/client.tsx`) — entrypoint for client-side request lifecycle.

[routesEntry](#routes-entry) (default: `src/routes.tsx`) — entrypoint for route definitions.

## Server Entry

### onRequest

Called on every document request **after** consumer Express middleware.
Receives **`{ req }` only** — the Express request (not a Fetch `Request`).
Use it for per-request shell behaviour before React render.

Fetch `Request` stays on React Router `query()` / loaders and optional server [`getContext`](#getcontext-optional).

**Returns**

- `site` — **required** configured site name (must appear in non-empty config [`sites`](../configuration.md#sites)); selects the pre-built site route tree (see [Routing → Multi-site](./routing.md#multi-site-path-sets))
- `language` — name of language file translations to be pre-loaded on the client
- `clientContext` — serialisable content to be made available to the client

Providers are **not** returned from here — export [`Providers`](#providers-optional) separately.

### Typing middleware-attached fields on `req`

`SkuSsrOnRequest` / server `getContext` use Express’s `Request`.
Fields you append in middleware (`req.user`, `req.log`, …) are not on the stock type.
Augment Express the same way sku does for `getCspNonce`:

```ts
// e.g. src/types/express.d.ts (ensure included by tsconfig)
declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: string };
    log?: { info: (msg: string) => void };
  }
}
```

That augmentation is shared by `middleware`, `onRequest`, and server `getContext`.

### Example

```tsx
// src/server.tsx
import type { SkuSsrMiddleware, SkuSsrOnRequest } from 'sku';

import { site } from './routes';

export const onRequest: SkuSsrOnRequest = ({ req }) => ({
  site,
  language: resolveLocaleFromPath(req.path), // e.g. 'th-TH'
  clientContext: {
    theme: 'dark',
    userId: req.user?.id ?? null,
  },
});

export { Providers } from './App/Providers';

export const middleware: SkuSsrMiddleware = [];
```

### middleware

Production middleware. Connect/Express handlers mounted before the HTML render path. See [Middleware](./middleware.md).

For React Router middleware see [Routing](./routing.md).

### Providers (optional)

Optional **separate** named export (not returned from `onRequest`) holding your React providers.
Sku reads it once at module init and renders it **outside** the router — `Document` → `Providers` → router — passing `{ children, site, clientContext }`.

Because it is outside the router it cannot use React Router hooks, and because it never wraps the route tree each site's `createStaticHandler` is built once instead of per request.

Omit the export → sku renders the router directly.

Router-aware wrapping belongs in your own root layout route in `routesEntry`. See [Providers](./providers.md).

### getContext (optional)

Optional **separate** named export (not folded into `onRequest`).
Seeds React Router’s `RouterContextProvider` for **loader/action DI** on document SSR.

Sku calls `getContext({ request, req })` before `query()` and passes the result as `requestContext`.

- `request` — Fetch `Request` (same shape as loaders)
- `req` — Express request after consumer middleware

Omit the export → today’s empty/default React Router context behaviour.

Prefer projecting **isomorphic values** both server and client can supply.
See [Data loading → Router context (`getContext`)](./data-loading.md#router-context-getcontext).

```tsx
import { createContext, RouterContextProvider } from 'react-router';
import type { SkuSsrServerGetContext } from 'sku';

export const userIdContext = createContext<string | null>(null);

export const getContext: SkuSsrServerGetContext = ({ req }) => {
  const ctx = new RouterContextProvider();
  ctx.set(userIdContext, req.user?.id ?? null);
  return ctx;
};
```

:::warning Never put Express `req` in `RouterContextProvider`
Project values / isomorphic-capable dependencies that **both** server and client `getContext` can supply.
Raw `req` is `undefined` on client navigations and becomes a landmine for loaders that assume it exists.
:::

## Client Entry

### onHydrate

Called on the client before hydration. Receives `{ clientContext }` (the deserialized `clientContext` from `onRequest`).

Returns nothing — it is for hydrate-time side effects only. Sku passes the same `clientContext` to [`Providers`](#providers-optional-1) as a prop, so there is no need to stash it in module state.

Sku reads hydrated `site` from the bootstrap (not an `onHydrate` argument) to select the same pre-built site tree as SSR. See [routing](./routing.md).

### Example

```tsx
// src/client.tsx
import type { SkuSsrOnHydrate } from 'sku';

export const onHydrate: SkuSsrOnHydrate = () => {};

export { Providers } from './App/Providers';
```

### Providers (optional)

Same contract as the server entry: a named export read once at module init and rendered outside the router with `{ children, site, clientContext }`.

The client providers **may differ from the server's** — export them only from the client entry for providers that construct against `window` and must not run during Document SSR.
Because the two may differ, they must render identical DOM; prefer context-only providers.

### getContext (optional)

Optional **separate** named export (not folded into `onHydrate`).
Sku passes it to `createBrowserRouter({ getContext })`, wrapping React Router’s zero-arg API so your export receives `{ clientContext }` (the hydrate seed from `onRequest`).

Called on **every** client navigation / fetcher — not once at hydrate.

```tsx
import { createContext, RouterContextProvider } from 'react-router';
import type { SkuSsrClientGetContext } from 'sku';

import { userIdContext } from './userIdContext';

export const getContext: SkuSsrClientGetContext = ({ clientContext }) => {
  const ctx = new RouterContextProvider();
  ctx.set(
    userIdContext,
    (clientContext as { userId?: string | null } | undefined)?.userId ?? null,
  );
  return ctx;
};
```

`Providers` (React dependencies, outside the router), your root layout route (router-aware wrapping), and `getContext` (loader/action DI) are three separate channels that compose — apps may only need one.
Note React Router 8 has no component-level hook for router context, so values needed by components belong in `Providers` or the root layout, not `getContext`.
`onRequest` / `onHydrate` cover site, language, `clientContext`, and hydrate side effects only.
See [Providers](./providers.md) and [Data loading](./data-loading.md).

## Routes Entry

### routes

Named export of a React Router route tree (`SkuSsrRouteObject[]`).

A SkuSsrRouteObject is a https://reactrouter.com/start/data/route-object with an extra property:

- `sites` (Optional) — When set, limits the route to only those sites.

See [Routing](./routing.md).

```tsx
// src/routes.tsx
import type { SkuSsrRouteObject } from 'sku';

import { homeRoute } from './pages/home/route.js';

export const routes: SkuSsrRouteObject[] = [
  {
    // Pathless root layout — your place for router-aware wrapping
    Component: RootLayout,
    children: [
      {
        index: true,
        lazy: () => import('./home.js'),
      },
    ],
  },
];
```

## `sku/ssr` helpers

The `sku/ssr` subpath is browser-safe and stays off the main `sku` entry (so webpack / static apps never pull the optional `react-router` peer).

- [`usePreloadRoute`](./routing.md#intent-preloading-with-usepreloadroute) — warm lazy route chunks on intent (hover / focus / touch)
- [`useInsertHtml`](#useinserthtml) — queue React nodes into the SSR response stream for app-owned streaming data transports

### `useInsertHtml`

Returns `(callback: () => ReactNode) => void`.
During document SSR, sku renders queued nodes to markup and writes them into the response so they run before hydration: the first batch is inserted before `</head>`, then further injections are written before each subsequent React chunk (with a final flush at stream end).
Off the SSR path (browser graph, development `Providers` markup probe) it is a silent no-op and never throws.

Use it to wire transports such as Apollo’s `buildManualDataTransport` — see [Apollo streaming hydration](./data-loading.md#apollo-streaming-hydration).
Injected script bodies are not known when CSP headers are derived from the shell, so they must carry the [CSP nonce](./csp.md) (for example Apollo `extraScriptProps={{ nonce: getCspNonce() }}` on the server entry).
