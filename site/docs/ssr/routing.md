# Routing

> [!CAUTION]
> Experimental — not for production.
> Managed Data Mode SSR is available for evaluation and testing. Do not use it in production yet. The API and behaviour may change.
> Until then, use [Webpack SSR](./webpack-ssr.md).

This page covers the route tree, page modules, multi-site membership, and intent preloading.

SSR uses [React Router Data Mode](https://reactrouter.com/start/modes#data) for routing.
Export a `routes` array from [`routesEntry`](../configuration.md#routesentry) (default `src/routes.tsx`).
sku connects that tree to React Router on the server and in the browser.

:::tip Prerequisite
Install **React Router** in your app (`react-router@^8`).
For route API details (layouts, loaders, error boundaries), see [React Router Data Mode routing](https://reactrouter.com/start/data/routing).
:::

## Add a page

### Compose the route tree

Each route can set a path (or `index`), optional site membership, and a lazy page import.
Put `loader`, `action`, `Component`, and `ErrorBoundary` on the lazily imported page module.
Do not put them on the route object in `routes.tsx`.
Use React Router’s [lazy factory](https://reactrouter.com/start/data/route-object#lazy) so each page is a separate chunk:

::: code-group

```tsx [routes.tsx]
import type { SkuRouteObject } from 'sku/runtime';

import { RootLayout } from './RootLayout';

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

export const RootLayout = () => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body>
      <Outlet />
    </body>
  </html>
);
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

Use a **pathless** root layout to render `<html>`, `<head>`, and `<body>`, plus shared UI and providers.
See [Providers](./providers.md).

The route tree is complete when:

- Pages load via `lazy: () => import(...)` (not static imports into `routes.tsx`)
- Each page module exports a named `Component`
- The pathless root layout renders `<html>`, `<head>`, and `<body>`

### Keep pages lazy

Do not statically import page modules into `routes.tsx`.
Static imports remove per-route chunking.
Prefer the idiomatic form so sku can derive production [`modulepreload`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link#modulepreload) links automatically:

```tsx
lazy: () => import('./pages/about/about');
```

### Automatic modulepreload

Idiomatic `lazy: () => import(...)` lets sku set `handle.moduleId` to the Vite client manifest key (for example `src/pages/about/about.tsx`).
The manifest key is the module path Vite records in the client manifest.
Production document responses then emit [`modulepreload`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link#modulepreload) links for the matched route.

If you use another `lazy` shape, set `handle.moduleId` yourself to that same manifest key.
sku warns in development when a lazy route is missing `moduleId`.
It skips that route’s production preloads.

### When to use loaders

For page content, prefer [render-time data loading](./data-loading.md).
Use loaders when you need document redirects or response headers.
Use loaders to start work above a suspending tree.
Export those loaders from the same page module as `Component`.

## Multi-site routes

When different sites need different path sets, set optional `sites` on a route.
sku only includes that route when the active site is in the list.
If you omit `sites`, the route is available on every configured site.

Resolve the active site in the server entry with [`getSite`](./entries.md#getsite).
Provide `getSite` when config has more than one site. Omit it on single-site apps:

::: code-group

```tsx [routes.tsx]
import type { SkuRouteObject } from 'sku/runtime';

import { RootLayout } from './RootLayout';

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

### Strictly typed sites in route objects

When you set `sites` on a route, you can narrow the site type with `SkuRouteObject<SiteName>`.

You can take the site name from the return type of [`getSite`](./entries.md#getsite) with `SkuRouteObject<SiteOf<typeof server>>`.

Export route types from the same file as `createSkuContexts`.
Import them wherever you define routes.
Do not import the server entry into those files.

::: code-group

```tsx [skuContext.ts]
import {
  createSkuContexts,
  type SiteOf,
  type SkuRouteObject,
} from 'sku/runtime';

import type client from './client';
import type server from './server';

export const { useSite, useClientContext, useReactContext } = createSkuContexts<
  typeof server,
  typeof client
>();

export type AppRouteObject = SkuRouteObject<SiteOf<typeof server>>;
```

```tsx [routes.tsx]
import type { AppRouteObject } from './skuContext';

export const routes: AppRouteObject[] = [
  { path: 'au-only', sites: ['au'] },
  { path: 'nz-only', sites: ['nz'] },
];
```

:::

## Multiple paths with `mapRoutePath`

When the same page should match more than one concrete path, export optional `mapRoutePath` from `routesEntry`.
Examples include `/about` and `/fr/about`, or `/` and `/fr`.
sku calls it while it pre-builds each site tree.
It clones the route for each returned path.

sku calls index homes with `path: ''`.
Return `''` to keep `index: true`.
Return a non-empty string for a prefixed home without `index`.

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

## Case-sensitive paths

By default, sku matches route paths case-sensitively.
If a route omits React Router’s [`caseSensitive`](https://reactrouter.com/api/data-routers/RouteObject#casesensitive), sku sets `caseSensitive: true` while it pre-builds the site tree.
So `/about` matches a route with `path: 'about'`, and `/About` does not.

Set `caseSensitive: false` on a specific route when you need case-insensitive matching:

```tsx
{ path: 'about', caseSensitive: false, lazy: () => import('./pages/about/about') },
```

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
The call is fire-and-forget.
A failed warm-up never throws.
Navigation reports the real error.
sku does not prefetch loader data.
It loads route modules only.

## React Router route middleware

React Router Data Mode supports a `middleware` array on routes.
That behaviour is isomorphic (same on server and client) for matched routes.
That is separate from Express middleware on the server entry.
Use Express for HTTP-level work.
Use route `middleware` for behaviour tied to the matched route tree.
See [Middleware](./middleware.md#react-router-route-middleware) for when to use each.

## See also

- [Providers](./providers.md) — root layout and typed hooks
- [Data loading](./data-loading.md) — render-time fetch and loaders
- [Middleware](./middleware.md) — Express vs React Router route `middleware`
- [Multi-language](./multi-language.md) — language chunks and path prefixes
- [Request entries](./entries.md#getsite) — `getSite` and other getters
