# Routing

:::danger Experimental — not for production
Managed Data Mode SSR is available for evaluation and testing. Do not use it in production yet; the API and behaviour may change.
In the meantime, continue using [Webpack SSR](./webpack-ssr.md).
:::

SSR uses [React Router Data Mode](https://reactrouter.com/start/modes#data) for routing.

Export a `routes` array from `src/routes.tsx` (config [`routesEntry`](../configuration.md#routesentry)).
sku wires that tree into React Router on the server and in the browser.

Install **React Router** in your app (`react-router@^8`).
For route API details (layouts, loaders, error boundaries), see [React Router Data Mode routing](https://reactrouter.com/start/data/routing).

## Add a page

Compose path / index / `sites` / `lazy` in `routesEntry`.
Put `loader`, `action`, `Component`, and `ErrorBoundary` on the lazily imported page module.
Use React Router’s [lazy factory](https://reactrouter.com/start/data/route-object#lazy) so each page is a separate chunk:

```tsx
// src/routes.tsx
import type { SkuRouteObject } from 'sku';

import { RootLayout } from './App/RootLayout';

export const routes: SkuRouteObject[] = [
  {
    Component: RootLayout,
    children: [
      { index: true, lazy: () => import('./pages/home/home') },
      { path: 'about', lazy: () => import('./pages/about/about') },
    ],
  },
];
```

Lazy page modules must export a named `Component` (not `export default`):

```tsx
// src/pages/about/about.tsx
export function Component() {
  return <main>About</main>;
}
```

Use a **pathless** root layout for app chrome and providers (see [Providers](./providers.md)).

Do not statically import page modules into `routes.tsx`, or you lose per-route chunking.
Prefer idiomatic `lazy: () => import('./pages/about/about')` so sku can derive production modulepreloads automatically.

For page content, prefer [render-time data loading](./data-loading.md).
Use loaders when you need document redirects, response headers, or to start work above a suspending tree.
Export those loaders from the same page module as `Component`.

## Multi-site routes

When different sites need different path sets, add optional `sites` on a route to limit which config sites it appears on.
Resolve the active site in the server entry with `getSite` (required when config has more than one site; omit on single-site apps):

```tsx
// src/routes.tsx
import type { SkuRouteObject } from 'sku';

export const routes: SkuRouteObject[] = [
  {
    Component: RootLayout,
    children: [
      { index: true, lazy: () => import('./pages/home/home') },
      {
        path: 'au-only',
        sites: ['au'],
        lazy: () => import('./pages/au-only/au-only'),
      },
      {
        path: 'nz-only',
        sites: ['nz'],
        lazy: () => import('./pages/nz-only/nz-only'),
      },
    ],
  },
];
```

```tsx
// src/server.tsx
import { defineServerEntry } from 'sku/runtime';

const server = defineServerEntry({
  getSite({ req }) {
    return req.get('x-site') === 'nz' ? 'nz' : 'au';
  },
});
export default server;
```

Omit `sites` on a route ⇒ it is available on every configured site.
When path **shape** differs by site (for example `/jobs` vs `/emploi`), keep using factories for those path strings — membership still belongs on the route via `sites`.

Serving the same page at multiple **language** prefixes is covered under [Multi-language](./multi-language.md#multiple-paths-per-page--languages-in-path).

## Intent preloading with `usePreloadRoute`

Document `modulepreload` links cover the route matched for this request.
To warm chunks for a route the user is about to visit (React Router Data Mode has no `<Link prefetch>`), use `usePreloadRoute`:

```tsx
import { Link, type LinkProps } from 'react-router';
import { usePreloadRoute } from 'sku/runtime';

export function PreloadingLink({ to, ...rest }: LinkProps) {
  const preload = usePreloadRoute(to);

  return (
    <Link
      to={to}
      onMouseEnter={preload}
      onFocus={preload}
      onTouchStart={preload}
      {...rest}
    />
  );
}
```

Calling the returned function loads matched lazy route modules for the current site.
It is fire-and-forget — a failed warm-up never throws; navigation reports the real error.
Loader data is not prefetched — only route modules.

## Custom lazy shapes and `handle.moduleId`

Prefer `lazy: () => import('./pages/about/about')` so sku can derive production modulepreloads automatically.

If you need a non-idiomatic lazy shape (granular `lazy: { Component: … }`, multiple `import()` calls, or an indirect binding), set `handle.moduleId` to the Vite client manifest key (usually the source path, for example `src/pages/about/about.tsx`).
An explicit value is never overwritten.

## React Router route middleware

React Router Data Mode supports a `middleware` array on routes.
That is separate from Express middleware on the server entry — see [Middleware](./middleware.md).
