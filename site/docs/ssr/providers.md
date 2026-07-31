# Providers

`Providers` is an **optional named export** on `serverEntry` and/or `clientEntry`, for **dependency injection only** — not page layout or HTML.

Sku renders it **outside** the router, between the Document and the router provider:

```
Document
  └── Providers            ← optional, from serverEntry / clientEntry
        └── RouterProvider / StaticRouterProvider
              └── your routes, whose root layout route is yours
```

Because it sits outside the router, `Providers` **cannot use React Router hooks** (`useLocation`, `useParams`, loader data). Wrapping that needs them is your app's own [root layout route](#router-aware-wrapping-is-a-route-not-a-provider).

This is your opportunity to define providers whose implementation or dependencies differ between server and client.
For example, an API client might make requests differently in each environment, so the same provider constructs a different client per side.

Omit the export and sku renders the router directly.

```tsx
// src/server.tsx
import type { SkuSsrProviders } from 'sku';

export { Providers } from './App/Providers';

// …or define it inline
export const Providers: SkuSsrProviders = ({ children }) => (
  <ThemeProvider>{children}</ThemeProvider>
);
```

## Props

Sku passes the request values you need so `Providers` never has to reach for request state:

- `children` — the router
- `site` — the `site` returned from `onRequest`
- `clientContext` — that request's `clientContext` seed (`undefined` when `onRequest` omits it)

The server and the client receive the **same values** for a given document, so both sides render identically.

```tsx
// src/client.tsx
import type { SkuSsrProviders } from 'sku';

type ClientContext = { userId: string | null };

export const Providers: SkuSsrProviders<ClientContext> = ({
  children,
  site,
  clientContext,
}) => (
  <SiteContext.Provider value={site}>
    <UserContext.Provider value={clientContext?.userId ?? null}>
      {children}
    </UserContext.Provider>
  </SiteContext.Provider>
);
```

Type the export with `SkuSsrProviders<Context>` (or the props alone with `SkuSsrProvidersProps<Context>`) to get a typed `clientContext`.

## Why it is a named export, not a return value

`Providers` is read once when the entry module is first evaluated, and it is never returned from `onRequest` / `onHydrate`.

Returning a component per request would create a new component type on every request, remounting your provider subtree.
Keeping it out of the router also means sku never rebuilds the route tree: each site's React Router `createStaticHandler` is created once at init instead of on the request hot path.
This mirrors React Router Framework Mode, which wraps outside the router in `entry.server.tsx` / `entry.client.tsx` and creates its handler at boot.

## Providers must not render DOM

Server and client `Providers` may differ, so any markup they emit is a hydration hazard. Prefer context-only providers.

Sku warns in development when an entry's `Providers` renders hydration-relevant markup.

## Router-aware wrapping is a route, not a provider

Wrapping that needs React Router hooks or loader data belongs in your own root layout route in `routesEntry` — plain React Router, no sku API.
Prefer a **pathless** layout route over `path: '/'`: matching is identical, it reads as a layout rather than a URL, and it keeps wrapping any root-level sibling you add later.

```tsx
// src/routes.tsx
import { VocabProvider } from '@vocab/react';
import { Outlet, useLocation } from 'react-router';
import type { SkuSsrRouteObject } from 'sku';

const RootLayout = () => {
  const { pathname } = useLocation();
  return (
    <VocabProvider language={resolveLocaleFromPathname(pathname)}>
      <Outlet />
    </VocabProvider>
  );
};

export const routes: SkuSsrRouteObject[] = [
  {
    Component: RootLayout,
    children: [homeRoute, aboutRoute],
  },
];
```

A provider that is both client-only _and_ router-aware splits in two: the dependency goes in the client `Providers`, and a small router-aware consumer component goes in the root layout.

## Where request-scoped values go

- **`Providers` props** — `site` and the `clientContext` seed, identical on both sides.
- **Re-derive in the route tree** — read the URL with React Router hooks in your root layout. Best for anything that must track client navigation, such as locale. `clientContext` is a page-load seed and does not change across client navigations.
- **[`getContext`](./data-loading.md#router-context-getcontext)** — for loader / action DI rather than React providers.

Do not reach for consumer-authored Async Local Storage or module-level mutable state set by `onHydrate` — the props above cover it.

## Notes

**Braid apps:** import `braid-design-system/reset` before any module that touches Braid on the **server** graph (for example at the top of `serverEntry`, and any early-imported loader/page that pulls Braid).
On `sku start`, Vite’s SSR evaluation order can differ from production and may throw “Braid components imported before reset” if reset only lives in a later-imported client/App module.
Sku does **not** auto-inject Braid reset into the SSR server entry — Braid is optional per app.

**Browser-only providers:** do not construct against `window` in the Document SSR tree (analytics SDKs, etc.).
Export `Providers` from the **client** entry only for those, and inject server- or client-specific clients the same way. See [data loading](./data-loading.md).

A consumer root `ErrorBoundary` does **not** catch errors thrown while rendering `Providers` — it sits above the router entirely. See [Error pages](./error-pages.md).
