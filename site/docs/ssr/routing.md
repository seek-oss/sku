# Routing

:::danger Experimental — not for production
Managed Data Mode SSR is available for evaluation and testing. Do not use it in production yet; the API and behaviour may change.
In the meantime, continue using [Webpack SSR](./webpack-ssr.md).
:::

This page covers the route tree, page modules, multi-site membership, and intent preloading.

SSR uses [React Router Data Mode](https://reactrouter.com/start/modes#data) for routing.
Export a `routes` array from [`routesEntry`](../configuration.md#routesentry) (default `src/routes.tsx`).
sku wires that tree into React Router on the server and in the browser.

:::tip Prerequisite
Install **React Router** in your app (`react-router@^8`).
For route API details (layouts, loaders, error boundaries), see [React Router Data Mode routing](https://reactrouter.com/start/data/routing).
:::

## Add a page

### Compose the route tree

Each route can set `path`, `index`, optional `sites`, and a `lazy` import.
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

Use a **pathless** root layout for app chrome and providers (see [Providers](./providers.md)).

You’re set up when:

- Pages load via `lazy: () => import(...)` (not static imports into `routes.tsx`)
- Each page module exports a named `Component`
- App chrome lives on a pathless root layout

### Page module exports

Lazy page modules must export a named `Component` (not `export default`):

```tsx
// src/pages/about/about.tsx
export function Component() {
  return <main>About</main>;
}
```

### Keep pages lazy

Do not statically import page modules into `routes.tsx`, or you lose per-route chunking.
Prefer the idiomatic form so sku can derive production [`modulepreload`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link#modulepreload) links automatically:

```tsx
lazy: () => import('./pages/about/about');
```

### When to use loaders

For page content, prefer [render-time data loading](./data-loading.md).
Use loaders when you need document redirects, response headers, or to start work above a suspending tree.
Export those loaders from the same page module as `Component`.

## Multi-site routes

When different sites need different path sets, set optional `sites` on a route.
sku only includes that route when the active site is in the list.
If you omit `sites`, the route is available on every configured site.

Resolve the active site in the server entry with `getSite` (required when config has more than one site; omit on single-site apps):

```tsx
// src/routes.tsx
import type { SkuRouteObject } from 'sku';

import { RootLayout } from './App/RootLayout';

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

When the path itself differs by site (for example `/jobs` vs `/emploi`), declare separate route objects with the right `path` and `sites`.
A small helper that returns the path string is fine — site membership still belongs on the route via `sites`:

```tsx
{
  path: jobsPathForSite('au'), // e.g. 'jobs'
  sites: ['au'],
  lazy: () => import('./pages/jobs/jobs'),
},
{
  path: jobsPathForSite('nz'), // e.g. 'emploi'
  sites: ['nz'],
  lazy: () => import('./pages/jobs/jobs'),
},
```

Serving the same page at multiple **language** prefixes is covered under [Multi-language](./multi-language.md#multiple-paths-per-page--languages-in-path).

## Intent preloading with `usePreloadRoute`

On the initial document, sku already emits `modulepreload` links for the matched route’s chunks.
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

## Advanced: custom lazy shapes

If you need a non-idiomatic lazy shape (granular `lazy: { Component: … }`, multiple `import()` calls, or an indirect binding), set `handle.moduleId` to the Vite client manifest key — usually the source path relative to the project root, for example `src/pages/about/about.tsx`.
An explicit value is never overwritten.
Otherwise prefer the idiomatic `lazy` form above so sku can derive preloads for you.

## React Router route middleware

React Router Data Mode supports a `middleware` array on routes for isomorphic behaviour on matched routes.
That is separate from Express middleware on the server entry — see [Middleware](./middleware.md) for when to use each.

## See also

- [Providers](./providers.md) — root layout and typed hooks
- [Data loading](./data-loading.md) — render-time fetch and loaders
- [Middleware](./middleware.md) — Express vs React Router route `middleware`
- [Multi-language](./multi-language.md) — language chunks and path prefixes
- [Request entries](./entries.md#getsite) — `getSite` and other getters
