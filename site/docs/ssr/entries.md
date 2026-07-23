# Request entries

sku SSR uses two primary entries:

[serverEntry](#server-entry) (default: `src/server.tsx`) — entrypoint for server-side code.

[clientEntry](#client-entry) (default: `src/client.tsx`) — entrypoint for client-side code.

## Server Entry

### Routes

Your React Router routes, see [routing](./routing.md).

### onRequest

Called on every document request **after** consumer Express middleware.
Receives **`{ req }` only** — the Express request (not a Fetch `Request`).
Use it for per-request shell behaviour before React render.

Fetch `Request` stays on React Router `query()` / loaders and optional server [`getContext`](#getcontext-optional).

**Returns**

- `AppWrapper` - see [App Wrapper / Providers](./providers.md)
- `language` — name of language file translations to be pre-loaded on the client
- `clientContext` — serialisable content to be made available to the client

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

import { Providers } from './App/Providers';
import { createRoutes } from './routes';

export const routes = createRoutes();

export const onRequest: SkuSsrOnRequest = ({ req }) => ({
  language: resolveLocaleFromPath(req.path), // e.g. 'th-TH'
  clientContext: {
    theme: 'dark',
    userId: req.user?.id ?? null,
  },
  AppWrapper: Providers,
});

export const middleware: SkuSsrMiddleware = [];
```

### middleware

Production middleware. Connect/Express handlers mounted before the HTML render path. See [Middleware](./middleware.md).

For React Router middleware see [Routing](./routing.md).

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

### Routes

Your React Router routes — must be hydration-compatible with the server tree. See [routing](./routing.md).

### onHydrate

Called on the client before hydration. Receives `{ context }` (deserialized `clientContext` from `onRequest`).

**Returns**

- `AppWrapper` — see [App Wrapper / Providers](./providers.md)

### Example

```tsx
// src/client.tsx
import type { SkuSsrOnHydrate } from 'sku';

import { Providers } from './App/Providers';
import { createRoutes } from './routes';

export const routes = createRoutes();

export const onHydrate: SkuSsrOnHydrate = () => ({
  AppWrapper: Providers,
});
```

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

`onRequest` / `onHydrate` (React providers) and `getContext` (loader/action DI) compose — apps may only need one.
See [Data loading](./data-loading.md).
