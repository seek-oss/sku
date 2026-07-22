# Request entries

sku SSR uses two primary entries:

[serverEntry](#server-entry) (default: `src/server.tsx`) — entrypoint for server-side code.

[clientEntry](#client-entry) (default: `src/client.tsx`) — entrypoint for client-side code.

## Server Entry

### Routes

Your React Router routes, see [routing](./routing.md).

### onRequest

Called on every request. Used for modifying per-request context and behaviour before starting React render.

**Returns**

- `AppWrapper` - see [App Wrapper / Providers](./providers.md)
- `language` — name of language file translations to be pre-loaded on the client
- `clientContext` — serialisable content to be made available to the client

### Example

```tsx
// src/server.tsx
import type { SkuSsrMiddleware, SkuSsrOnRequest } from 'sku';

import { Providers } from './App/Providers';
import { createRoutes } from './routes';

export const routes = createRoutes();

export const onRequest: SkuSsrOnRequest = ({ request }) => ({
  language: resolveLocaleFromRequest(request), // e.g. 'th-TH'
  clientContext: { theme: 'dark' },
  AppWrapper: Providers,
});

export const middleware: SkuSsrMiddleware = [];
```

### middleware

Production middleware. Connect/Express handlers mounted before the HTML render path. See [Middleware](./middleware.md).

For React Router middleware see [Routing](./routing.md).

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
