# Routing

SSR uses [React Router Data Mode](https://reactrouter.com/start/modes#data) for routing.

You export a named `routes` (`RouteObject[]`) from **both** `serverEntry` and `clientEntry`; sku owns the HTTP server, document shell, streaming, and hydration, and wires each side’s route config into React Router on the server and in the browser.

Lazy routes, nested layouts, and error boundaries are standard Data Mode APIs.

For page content, prefer [render-time data loading](./data-loading.md) via `AppWrapper` + Suspense; use loaders when you need waterfalls, document redirects, or response headers.

SSR requires **React Router** to be installed within your app.

Server and client route trees **must** stay hydration-compatible (same path / nesting / ids so server HTML matches hydrated HTML).
Implementations on those trees (for example React Router route `middleware`, loaders, or component bodies) **may** diverge.

Because consumer routes/entries use React Router Data Mode APIs that sku wires in, a future React Router **major** upgrade in sku may be a breaking change for SSR apps.
Minor/patch upgrades within the documented major stay non-breaking when APIs remain compatible.

For information on how to use React Router to register routes, see [React Router Data Mode](https://reactrouter.com/start/data/routing).

## Routes

Export named `routes` from **both** the [server and client entries](./entries.md).
These need to match in HTML and will likely only differ based on loaders or middleware.

```tsx
// src/pages/home/route.ts
import type { RouteObject } from 'react-router';

export const homeRoute = {
  index: true,
  // Idiomatic lazy — sku auto-derives handle.moduleId for production modulepreloads
  lazy: () => import('./home.js'),
} satisfies RouteObject;
```

```tsx
// src/routes.tsx
import type { RouteObject } from 'react-router';

import { homeRoute } from './pages/home/route.js';

export function createRoutes(): RouteObject[] {
  return [
    {
      path: '/',
      children: [homeRoute],
    },
  ];
}
```

```tsx
// src/server.tsx
import { createRoutes } from './routes.js';

export const routes = createRoutes();

// … onRequest, middleware
```

```tsx
// src/client.tsx
import { createRoutes } from './routes.js';

export const routes = createRoutes();

// … onHydrate
```

Prefer co-locating each page in its own directory with a `route.ts` (path / lazy / loaders / handle) and the page module (e.g. `home.tsx`).
Compose those route modules inside `createRoutes`.

Lazy page modules MUST use React Router Data Mode’s named `Component` export (not `export default`) so they typecheck with `lazy: () => import('…')`:

```tsx
// src/pages/home/home.tsx
export function Component() {
  return <h1>Home</h1>;
}
```

sku owns:

- the HTTP(S) server (dev: Vite `middlewareMode` + HMR on one port; prod: `node dist/server/server.js`)
- the React Document shell (`<html>` / `<head>` / `<body>` with CSS + modulepreload links) — not overridable; use React document metadata in routes/layouts for head/SEO
- full-document streaming with `renderToPipeableStream` (shell-first; set route `handle.waitForAll` to buffer until `onAllReady`)
- document-level hydration (`hydrateRoot(document, …)`), not `#app`
- CSP as HTTP headers when `cspEnabled` / `cspReportOnlyEnabled` are set (see [CSP](./csp.md))
- forwarding React Router loader/action headers onto streamed HTML responses (see [Response headers](./data-loading.md#response-headers))

`httpsDevServer: true` is supported for SSR `sku start`.

## Lazy routes and `handle.moduleId`

Prefer React Router’s idiomatic lazy form so each route is a separate async chunk (on server and client).
Put that `lazy` on the page’s `route.ts` so sku can auto-derive `handle.moduleId` from a single string-literal `import()` during the SSR transform:

```tsx
// src/pages/about/route.ts
export const aboutRoute = {
  path: 'about',
  lazy: () => import('./about.js'),
} satisfies RouteObject;

// src/pages/about/about.tsx — named Component (not default export)
export function Component() {
  return <main>About</main>;
}

// src/pages/details/route.ts
export const detailsRoute = {
  path: 'details',
  lazy: () => import('./details.js'),
} satisfies RouteObject;
```

Do **not** statically import those page modules into `createRoutes` / `route.ts` — that eagerly bundles them and defeats per-route chunking.
Import only the route configs.
The `fixtures/vite-ssr` app demonstrates this pattern with distinct `about` and `details` chunks.

**Escape hatch:** set `handle.moduleId` explicitly to the Vite client manifest key (usually the source path, e.g. `src/pages/about/about.tsx`) when you need a custom key or a non-idiomatic `lazy` shape.
An explicit value is never overwritten.

sku does **not** guess for non-idiomatic shapes (no injection):

- granular `lazy: { Component: … }`
- lazy functions with multiple `import()` calls
- indirect bindings (`lazy: loadAbout`)

In development, sku warns when a lazy route still has no effective `moduleId` after transform, or when a provided `moduleId` is not found in the client manifest.

## React Router route `middleware`

React Router Data Mode also supports a `middleware` array on `RouteObject`s.
That is **not** the same as server-entry Express/Connect `middleware` — see [Middleware](./middleware.md).
Put route middleware on each entry’s `routes` (via `createRoutes(...)` options if they diverge).
Keep path / nesting / ids hydration-compatible when server and client implementations differ.

Serving the same page at multiple language prefixes is covered under [Multi-language](./multi-language.md#multiple-paths-per-page--languages-in-path).
