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

Each route can set a path (or `index`), optional site membership, and a lazy page import.
Put `loader`, `action`, `Component`, and `ErrorBoundary` on the lazily imported page module — not on the route object in `routes.tsx`.
Use React Router’s [lazy factory](https://reactrouter.com/start/data/route-object#lazy) so each page is a separate chunk:

::: code-group

```tsx [routes.tsx]
import type { SkuRouteObject } from 'sku/runtime';

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

```tsx [RootLayout.tsx]
import { Outlet } from 'react-router';

export const RootLayout = () => <Outlet />;
```

```tsx [home.tsx]
export function Component() {
  return <main>Home</main>;
}
```

```tsx [about.tsx]
export function Component() {
  return <main>About</main>;
}
```

:::

Lazy page modules must export a named `Component` (not `export default`).

Use a **pathless** root layout for shared UI and providers (see [Providers](./providers.md)).

You’re set up when:

- Pages load via `lazy: () => import(...)` (not static imports into `routes.tsx`)
- Each page module exports a named `Component`
- Shared UI lives on a pathless root layout

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

Resolve the active site in the server entry with [`getSite`](./entries.md#getsite) (required when config has more than one site; omit on single-site apps):

::: code-group

```tsx [routes.tsx]
import type { SkuRouteObject } from 'sku/runtime';

import { RootLayout } from './App/RootLayout';

export const routes: SkuRouteObject[] = [
  {
    Component: RootLayout,
    children: [
      { index: true, lazy: () => import('./pages/home/home') },
      {
        path: 'au-only',
        sites: ['au'], // [!code highlight]
        lazy: () => import('./pages/au-only/au-only'),
      },
      {
        path: 'nz-only',
        sites: ['nz'], // [!code highlight]
        lazy: () => import('./pages/nz-only/nz-only'),
      },
    ],
  },
];
```

```tsx [server.tsx]
import { defineServerEntry } from 'sku/runtime';

const server = defineServerEntry({
  getSite({ req }) {
    return req.get('x-site') === 'nz' ? 'nz' : 'au';
  },
});

export default server;
```

:::

## Multiple paths with `mapRoutePath`

When the same page should match more than one concrete path (for example `/about` and `/fr/about`, or `/` and `/fr`), export optional `mapRoutePath` from `routesEntry`.
sku calls it while pre-building each site tree and clones the route for each returned path.
Index homes are called with `path: ''` — return `''` to keep `index: true`, or a non-empty string for a prefixed home without `index`.

```tsx
import type { MapRoutePath, SkuRouteObject } from 'sku/runtime';

export const mapRoutePath: MapRoutePath = ({ path, site, parentSegments }) => {
  if (parentSegments.length > 0) {
    return [path];
  }
  if (path === '' && site === 'au') {
    return ['', 'au'];
  }
  if (path === 'about' && site === 'au') {
    return ['about', 'au/about'];
  }
  return [path];
};

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

See [Multi-language → Languages in the path](./multi-language.md#languages-in-the-path) for the localisation-prefix case.

## Intent preloading with `usePreloadRoute`

On the initial document, sku already emits `modulepreload` links for the matched route’s chunks.
To warm chunks for a route the user is about to visit, use `usePreloadRoute`:

```tsx
import { Link, type LinkProps } from 'react-router';
import { usePreloadRoute } from 'sku/runtime';

export function PreloadingLink({ to, ...rest }: LinkProps) {
  const preload = usePreloadRoute(to); // [!code highlight]

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

## React Router route middleware

React Router Data Mode supports a `middleware` array on routes for isomorphic behaviour on matched routes.
That is separate from Express middleware on the server entry: use Express for HTTP-level work, and route `middleware` for behaviour tied to the matched route tree.
See [Middleware](./middleware.md#react-router-route-middleware) for when to use each.

## See also

- [Providers](./providers.md) — root layout and typed hooks
- [Data loading](./data-loading.md) — render-time fetch and loaders
- [Middleware](./middleware.md) — Express vs React Router route `middleware`
- [Multi-language](./multi-language.md) — language chunks and path prefixes
- [Request entries](./entries.md#getsite) — `getSite` and other getters
