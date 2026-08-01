# Request entries

sku SSR uses three entry modules:

[serverEntry](#server-entry) (default: `src/server.tsx`) — entrypoint for server-side request lifecycle.

[clientEntry](#client-entry) (default: `src/client.tsx`) — entrypoint for client-side request lifecycle.

[routesEntry](#routes-entry) (default: `src/routes.tsx`) — entrypoint for route definitions.

Request entries each **`export default`** one object from `defineServerEntry` / `defineClientEntry` (zero-runtime inference helpers on `sku/ssr`).
Pass `defineClientEntry<typeof server>()({ … })` so client callbacks get `Site` / `ClientContext` from the server entry — see [Providers](./providers.md#entry-objects-defineserverentry--definecliententry).
Sku reads that default export and calls optional properties.

## Server Entry

**Always** wrap the default export with [`defineServerEntry`](./providers.md#entry-objects-defineserverentry--definecliententry) from `sku/ssr`. It is a zero-runtime identity helper that creates a TypeScript inference scope so getter returns type later sibling args (and client `Site` / `ClientContext` via `defineClientEntry<typeof server>`).

Sync getters on the default-exported object run on every document request **after** consumer Express middleware and **before** `query()`.

**Call order:** `getSite` → `getLanguage` → `getClientContext` → `getReactContext` → optional `getRouterContext` → `query()`.

Early getters (`getSite` / `getLanguage` / `getClientContext`) receive **`{ req }` only** — the Express request (not a Fetch `Request`).
Prefer keeping them pure and simple; libraries that parse once can memoise on `req`.

Later getters receive already-resolved sibling values so you can project instead of re-deriving.
Fetch `Request` stays on React Router `query()` / loaders and optional server [`getRouterContext`](#getroutercontext).

### getSite

Resolves the active site name for this request.

```ts
getSite?: (args: { req: ExpressRequest }) => Site;
```

- **Required** when config has more than one site (hard error at init if missing)

Use [`useSite()`](./providers.md#typed-hooks-createskussrcontexts) to access within the application.

See [Routing → Multi-site](./routing.md#multi-site-path-sets).

### getLanguage

Resolves the language for Document vocab chunk registration.

```ts
getLanguage?: (args: { req: ExpressRequest }) => Language;
```

Use [`useLanguage()`](./providers.md#typed-hooks-createskussrcontexts) to access within the application.

See [Multi-language](./multi-language.md).

### getClientContext

JSON serialisable content sent to the client and passed to React and Router context.

```ts
getClientContext?: (args: { req: ExpressRequest }) => ClientContext;
```

### getReactContext

Server-specific values for React via `useReactContext` (e.g. API clients).

```ts
getReactContext?: (args: {
  req: ExpressRequest;
  site: Site;
  clientContext: ClientContext | undefined;
}) => ReactContext;
```

### middleware

Express middleware run before SSR for each request.

```ts
middleware?: SkuSsrMiddleware;
```

Connect/Express handlers mounted before the HTML render path.
Omit ⇒ no consumer middleware layer (not an error).
See [Middleware](./middleware.md).

For React Router middleware see [Routing](./routing.md).

### getRouterContext

Server-specific values for Router context (loaders, actions and middleware).

```ts
getRouterContext?: (args: {
  request: Request;
  req: ExpressRequest;
  site: Site;
  clientContext: ClientContext | undefined;
  reactContext: ReactContext | undefined;
}) => RouterContextProvider | Promise<RouterContextProvider>;
```

Seeds React Router’s `RouterContextProvider` for **loader/action DI** on document SSR.

Sku calls `getRouterContext({ request, req, site, clientContext, reactContext })` before `query()` and passes the result as `requestContext`.

- `request` — Fetch `Request` (same shape as loaders)
- `req` — Express request after consumer middleware
- `site` / `clientContext` / `reactContext` — already-resolved siblings

Omit ⇒ today’s empty/default React Router context behaviour.

Prefer projecting **isomorphic values** both server and client can supply.
See [Data loading → Router context (`getRouterContext`)](./data-loading.md#router-context-getroutercontext).

:::warning Never put Express `req` in `RouterContextProvider`
Project values / isomorphic-capable dependencies that **both** server and client `getRouterContext` can supply.
Raw `req` is `undefined` on client navigations and becomes a landmine for loaders that assume it exists.
:::

### Example

```tsx
// src/server.tsx
import { RouterContextProvider } from 'react-router';
import { defineServerEntry } from 'sku/ssr';

import { userIdContext } from './userIdContext';

const server = defineServerEntry({
  // Multi-site: include getSite. Single-site: omit it — sku uses the sole config site.
  // Narrow returns — avoid SkuSsrGetSite / SkuSsrGetLanguage annotations (they widen to string).
  getSite({ req }) {
    return req.get('x-site') === 'nz' ? 'nz' : 'au';
  },
  getLanguage({ req }) {
    return resolveLocaleFromPath(req.path); // e.g. 'th-TH'
  },
  getClientContext({ req }) {
    return {
      theme: 'dark',
      userId: req.user?.id ?? null,
    };
  },
  getRouterContext({ clientContext, site }) {
    // site inferred as 'au' | 'nz' from getSite
    void site;
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

## Client Entry

**Always** wrap the default export with [`defineClientEntry`](./providers.md#entry-objects-defineserverentry--definecliententry) from `sku/ssr`. Prefer `defineClientEntry<typeof server>()({ … })` so client callbacks get typed `Site` / `ClientContext` from the server entry — see [Providers](./providers.md#entry-objects-defineserverentry--definecliententry).

### onHydrate

Side effects to run before client React hydrate.

```ts
onHydrate?: (args: {
  clientContext: ClientContext | undefined;
}) => void;
```

Receives `{ clientContext }` (the deserialized seed from `getClientContext`).

Returns nothing — hydrate-time side effects only. Request values reach React via [`SkuSsrProvider`](./providers.md), so there is no need to stash them in module state.

Omit ⇒ no hydrate side effects (not an error).

Sku reads hydrated `site` from the bootstrap (not an `onHydrate` argument) to select the same pre-built site tree as SSR. See [routing](./routing.md).

### getReactContext

Client-specific values for React via `useReactContext` (e.g. API clients).

```ts
getReactContext?: (args: {
  site: Site;
  clientContext: ClientContext | undefined;
}) => ReactContext;
```

Same channel as the server: env-differing React values for `useReactContext()`.
Receives `{ site, clientContext }` from the hydrate bootstrap (no Express).

### Example

```tsx
// src/client.tsx
import { RouterContextProvider } from 'react-router';
import { defineClientEntry } from 'sku/ssr';

import type server from './server';
import { userIdContext } from './userIdContext';

const client = defineClientEntry<typeof server>()({
  onHydrate() {},
  getRouterContext({ clientContext }) {
    // clientContext typed from server getClientContext
    const ctx = new RouterContextProvider();
    ctx.set(userIdContext, clientContext?.userId ?? null);
    return ctx;
  },
});

export default client;
```

### getRouterContext

Client-specific values for Router context (loaders, actions and middleware).

```ts
getRouterContext?: (args: {
  site: Site;
  clientContext: ClientContext | undefined;
  reactContext: ReactContext | undefined;
}) => RouterContextProvider;
```

Sku maps your `getRouterContext` into React Router’s native `createBrowserRouter({ getContext })`, wrapping the zero-arg API so your export receives `{ site, clientContext, reactContext }`.

Called on **every** client navigation / fetcher — not once at hydrate.

`getClientContext` / `getReactContext` / `SkuSsrProvider` hooks (React), your root layout route (router-aware wrapping), and `getRouterContext` (loader/action DI) are three separate channels that compose — apps may only need one.
See [Providers](./providers.md) and [Data loading](./data-loading.md).

## Routes Entry

### routes

Named export of a React Router route tree.

```ts
export const routes: SkuSsrRouteObject[];
```

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

- [`defineServerEntry` / `defineClientEntry`](./providers.md#entry-objects-defineserverentry--definecliententry) — zero-runtime entry inference helpers
- [`createSkuSsrContexts`](./providers.md#typed-hooks-createskussrcontexts) — typed `useSite` / `useClientContext` / `useReactContext`
- [`usePreloadRoute`](./routing.md#intent-preloading-with-usepreloadroute) — warm lazy route chunks on intent (hover / focus / touch)
- [`useInsertHtml`](#useinserthtml) — queue React nodes into the SSR response stream for app-owned streaming data transports
- `getCspNonce` — also available from the main `sku` entry

### `useInsertHtml`

Returns `(callback: () => ReactNode) => void`.
During document SSR, sku renders queued nodes to markup and writes them into the response so they run before hydration: the first batch is inserted before `</head>`, then further injections are written before each subsequent React chunk (with a final flush at stream end).
Off the SSR path (browser graph) it is a silent no-op and never throws.

Use it to wire transports such as Apollo’s `buildManualDataTransport` — see [Apollo streaming hydration](./data-loading.md#apollo-streaming-hydration).

Injected script bodies are not known when CSP headers are derived from the shell, so they must carry the [CSP nonce](./csp.md).

## Typing middleware-attached fields on `req`

Getters and server `getRouterContext` use Express’s `Request`.
Fields you append in middleware (`req.user`, `req.log`, …) are not on the stock type.
Augment Express the same way sku does for `getCspNonce`.

Install `@types/express-serve-static-core` as a direct dependency (pnpm does not expose sku’s copy for module augmentation), then:

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
