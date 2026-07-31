# Routing

SSR uses [React Router Data Mode](https://reactrouter.com/start/modes#data) for routing.

You export a named `routes` (`SkuSsrRouteObject[]`) from config [`routesEntry`](../configuration.md#routesentry) (default `src/routes.tsx`); sku owns the HTTP server, document shell, streaming, and hydration, and wires the **selected site’s** route tree into React Router on the server and in the browser.

`SkuSsrRouteObject` is a sku type helper: React Router’s `RouteObject` plus optional `sites?: string[]` membership. Import route primitives from `react-router`; import `SkuSsrRouteObject` from `sku` when you need the `sites` field.

`onRequest` **must** return `site: string`. Config [`sites`](../configuration.md#sites) must be non-empty (≥1 site name) — empty `sites` is a hard error. Sku pre-builds a route tree per config site name from your flat `routes` (filtering by optional `sites`), selects the tree for that `site`, serialises `site` into the hydrate bootstrap, and uses the same tree for the client router. Missing / non-string `site`, or a `site` that is not a config site name, fails closed (hard error).

Exporting `routesBySite` is a hard error — use flat `routes` with optional `sites` instead.

Lazy routes, nested layouts, and error boundaries are standard Data Mode APIs.

For page content, prefer [render-time data loading](./data-loading.md) via the named [`Providers`](./providers.md) export + Suspense; use loaders when you need waterfalls, document redirects, response headers, or optional dual-entry [`getContext`](./data-loading.md#router-context-getcontext).

Sku never wraps your route tree. Wrapping that needs React Router hooks or loader data is your own **pathless** root layout route — see [Providers](./providers.md#router-aware-wrapping-is-a-route-not-a-provider).

SSR requires **React Router** to be installed within your app.

Because `routesEntry` is one module in both graphs, server and client use the same route tree for a given site (hydration-compatible by construction).
Implementations on those trees (for example React Router route `middleware`, loaders, or component bodies) stay isomorphic unless you intentionally keep server-only modules off the client-imported graph.

Because consumer routes/entries use React Router Data Mode APIs that sku wires in, a future React Router **major** upgrade in sku may be a breaking change for SSR apps.
Minor/patch upgrades within the documented major stay non-breaking when APIs remain compatible.

For information on how to use React Router to register routes, see [React Router Data Mode](https://reactrouter.com/start/data/routing).

## How to define your routes

Export a `routes` array (`SkuSsrRouteObject[]`) from [`routesEntry`](../configuration.md#routesentry).

Provide an optional `sites` param to limit which sites a route displays on.

### Lazy loading — Loading only content required for a given page

Routes should typically be defined using React Router's [lazy factory](https://reactrouter.com/start/data/route-object#lazy).

The import should

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
// src/routes.tsx (config routesEntry)
import type { SkuSsrRouteObject } from 'sku';

import { homeRoute } from './pages/home/route.js';

// Must match a name from config `sites` (e.g. sites: ['default']).
export const site = 'default' as const;

export const routes: SkuSsrRouteObject[] = [
  {
    // Pathless root layout — your place for router-aware wrapping
    Component: RootLayout,
    children: [homeRoute],
  },
];
```

```tsx
// src/server.tsx — request entry only
import { site } from './routes.js';

export const onRequest = () => ({
  site,
  // … language, clientContext
});

// … middleware
```

```tsx
// src/client.tsx — request entry only
// … onHydrate (no routes re-export)
```

Prefer co-locating each page in its own directory with a `route.ts` (path / lazy / loaders / handle) and the page module (e.g. `home.tsx`).
Compose those route modules in the `routesEntry` `routes` array.

Lazy page modules MUST use React Router Data Mode’s named `Component` export (not `export default`) so they typecheck with `lazy: () => import('…')`:

```tsx
// src/pages/home/home.tsx
export function Component() {
  return <h1>Home</h1>;
}
```

sku owns:

- the HTTP server (dev: Vite `middlewareMode` + HMR on one port; prod: `node dist/server/server.js`)
- the React Document shell (`<html>` / `<head>` / `<body>` with CSS + modulepreload links) — not overridable; use React document metadata in routes/layouts for head/SEO
- full-document streaming with `renderToPipeableStream` (shell-first; set route `handle.waitForAll` to buffer until `onAllReady`)
- document-level hydration (`hydrateRoot(document, …)`), not `#app`
- CSP as HTTP headers when `cspEnabled` / `cspReportOnlyEnabled` are set (see [CSP](./csp.md))
- forwarding React Router loader/action headers onto streamed HTML responses (see [Response headers](./data-loading.md#response-headers))
- pre-building per-site trees from config site names + optional route `sites` membership

`httpsDevServer: true` is supported for SSR `sku start`.

## Multi-site path sets

Multi-site apps often need **different React Router path sets** per site (for example site-only pages). A single unfiltered `RouteObject[]` either over-matches unsupported paths or registers foreign paths on every host.

**App-owned:** resolve `site` in `onRequest` (from Express `req`, headers, app config, etc.) and declare membership with optional `sites` on routes. When **path shape** differs by site (e.g. `/jobs` vs `/emploi`), keep using factories for those path strings — membership still belongs on the route via `sites`.

**Sku-owned:** filter flat `routes` into a pre-built tree per config site name (omit `sites` ⇒ every site; present ⇒ only listed names; no parent→child inheritance), strip `sites` before React Router, create each site's `createStaticHandler` once at init, select by `onRequest.site`, serialise `site` for hydrate, and use that same site on the client. Sku does **not** derive site from config [`hosts`](../configuration.md) / `sites[].host` for route-tree selection — those remain local-dev listen / setup-hosts only.

```tsx
// src/routes.tsx
import type { SkuSsrRouteObject } from 'sku';

export const routes: SkuSsrRouteObject[] = [
  {
    Component: RootLayout,
    children: [
      homeRoute,
      aboutRoute,
      { path: 'au-only', sites: ['au'] /* … */ },
      { path: 'nz-only', sites: ['nz'] /* … */ },
    ],
  },
];
```

```tsx
// src/server.tsx — app owns site resolution
export const onRequest = ({ req }) => ({
  site: resolveSiteFromRequest(req), // e.g. from Host, header, or middleware state
});
```

Do **not** rely on optional language path params, a union tree + site allowlist, `routesBySite` maps, dual-entry `routes` re-exports, or sku host matching as the multi-site product story — use [`routesEntry`](../configuration.md#routesentry) + flat `routes` + optional `sites` + `onRequest.site`.

Serving the same page at multiple **language** prefixes within one site is covered under [Multi-language](./multi-language.md#multiple-paths-per-page--languages-in-path).

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

Do **not** statically import those page modules into `routes` / `route.ts` — that eagerly bundles them and defeats per-route chunking.
Import only the route configs.
The `fixtures/vite-ssr` app demonstrates this pattern with distinct `about` and `details` chunks.

**Escape hatch:** set `handle.moduleId` explicitly to the Vite client manifest key (usually the source path, e.g. `src/pages/about/about.tsx`) when you need a custom key or a non-idiomatic `lazy` shape.
An explicit value is never overwritten.

sku does **not** guess for non-idiomatic shapes (no injection):

- granular `lazy: { Component: … }`
- lazy functions with multiple `import()` calls
- indirect bindings (`lazy: loadAbout`)

In development, sku warns when a lazy route still has no effective `moduleId` after transform, or when a provided `moduleId` is not found in the client manifest.

## Intent preloading with `usePreloadRoute`

The document `modulepreload` links cover the route that was **matched** for this request. Warming the chunks for the route a user is _about_ to visit is a separate concern, and React Router Data Mode has no `<Link prefetch>` — that is Framework Mode only.

sku exposes `usePreloadRoute` for this, because sku owns the site-filtered route tree the warm-up has to match against:

```tsx
import { Link, type LinkProps } from 'react-router';
import { usePreloadRoute } from 'sku/ssr';

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

`usePreloadRoute(to)` resolves `to` with `useHref` at render and returns a zero-argument function. Calling it matches `to` against the current site's tree and invokes `lazy()` for each matched route, in both of React Router's lazy shapes (a function, or an object of per-property lazy functions). The module graph caches those imports, so navigation's own `lazy()` call resolves from cache.

It is fire-and-forget: a failed warm-up never throws or rejects, and the real navigation reports the error instead.

Matching runs against the **site-filtered** tree, so a link to a path that belongs to another site warms nothing. Outside SSR apps — and during server render — no tree is registered and the returned function is a no-op (sku warns in development if you invoke it on the client without one).

The hook lives on the `sku/ssr` subpath so the main `sku` entry never pulls in the optional `react-router` peer for webpack or static Vite apps.

sku does not expose the route tree itself. Owning the match keeps every app from re-implementing the same `matchRoutes` + `lazy()` loop against an easy-to-get-wrong unfiltered tree.

Loader data is not prefetched — only route modules.

## React Router route `middleware`

React Router Data Mode also supports a `middleware` array on `RouteObject`s.
That is **not** the same as server-entry Express/Connect `middleware` — see [Middleware](./middleware.md).
Put route middleware on `routesEntry` `routes` (and use optional `sites` when a middleware-bearing route is site-specific).
