# Providers and request context

> [!CAUTION]
> Experimental — not for production.
> Managed Data Mode SSR is available for evaluation and testing.
> Do not use it in production yet.
> The API and behaviour may change.
> Until then, use [Webpack SSR](./webpack-ssr.md).

Pass request-scoped values into React with typed hooks.
Mount isomorphic providers (same on server and client), such as Braid, Vocab, and Apollo.
Mount shared UI in your **root layout** route.

sku mounts a `SkuProvider` outside the router:

```text
SkuProvider   ← site, clientContext, reactContext
 └── Router
      └── root layout route   ← <html>, <head>, <body>, providers, shared UI
           └── child route   ← ErrorBoundary
                └── pages
```

## Typed hooks

Create hooks bound to your entry objects:

```tsx
// src/skuContext.ts
import { createSkuContexts } from 'sku/runtime';

import type client from './client';
import type server from './server';

export const { useSite, useClientContext, useReactContext } = createSkuContexts<
  typeof server,
  typeof client
>();
```

- `useSite()` — active site name
- `useClientContext()` — serialisable content from `getClientContext` (shared with the browser)
- `useReactContext()` — env-specific values from `getReactContext` (may differ on server vs client)

To type `sites` on routes from the same `getSite` union, see [Strictly typed sites in route objects](./routing.md#strictly-typed-sites-in-route-objects).

## Pass values into React

**Serialisable content** (theme, user id) — set [`getClientContext`](./entries.md#getclientcontext) on the server entry and read with `useClientContext()`:

```tsx
// src/server.tsx
import { defineServerEntry } from 'sku/runtime';

const server = defineServerEntry({
  getClientContext({ req }) {
    return { userId: req.user?.id ?? null };
  },
});

export default server;
```

**Env-specific values** (API clients, server-only links) — set [`getReactContext`](./entries.md#getreactcontext) on **both** entries and read with `useReactContext()`:

::: code-group

```tsx [server.tsx]
import { defineServerEntry } from 'sku/runtime';

const server = defineServerEntry({
  getReactContext() {
    return {
      // Server-only client factory (API base URL, server link, …)
      makeClient: () => createServerClient(),
    };
  },
});

export default server;
```

```tsx [client.tsx]
import { defineClientEntry } from 'sku/runtime';

import type server from './server';

const client = defineClientEntry<typeof server>()({
  getReactContext() {
    return {
      makeClient: () => createBrowserClient(),
    };
  },
});

export default client;
```

:::

sku sets `clientContext` and `reactContext` for the page load.
They do not change across client navigations.
Anything that must track navigation (for example locale from the URL) belongs in the route tree.

For loader/action/route-middleware dependency injection, see [Data loading → Router context](./data-loading.md#router-context).

## Root layout for providers

In Managed Data Mode, your root layout renders the HTML document: `<html>`, `<head>`, and `<body>`.
Sku hoists stylesheet and `modulepreload` links into that `<head>`.
The layout is a **pathless** route, so it does not add a URL segment.
It renders inside sku's context and React Router, so you can use hooks such as [`useSite()`](#typed-hooks) and [`useLocation()`](https://reactrouter.com/api/hooks/useLocation).

::: code-group

```tsx [RootLayout.tsx]
import { BraidProvider } from 'braid-design-system';
import seekJobs from 'braid-design-system/themes/seekJobs';
import { Outlet } from 'react-router';

export const RootLayout = () => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body>
      <BraidProvider theme={seekJobs}>
        <Header />
        <Outlet />
        <Footer />
      </BraidProvider>
    </body>
  </html>
);
```

```tsx [routes.tsx]
import type { SkuRouteObject } from 'sku/runtime';

import { ErrorBoundary } from './ErrorBoundary';
import { RootLayout } from './RootLayout';

export const routes: SkuRouteObject[] = [
  {
    Component: RootLayout,
    children: [
      {
        ErrorBoundary,
        children: [
          { index: true, lazy: () => import('./pages/home/home') },
          { path: 'about', lazy: () => import('./pages/about/about') },
        ],
      },
    ],
  },
];
```

:::

### Providers wrapping html

App providers that `<head>` nodes need must wrap `<html>` in your root layout.
For example, if an inline font stylesheet reads brand or locale context, wrap `<html>` in that provider so `<head>` can consume it.
Isomorphic **provider components** mount in the root layout and read env-specific values with hooks.
See [Multi-language](./multi-language.md) and [Apollo streaming hydration](./data-loading.md#apollo-streaming-hydration).

## Braid reset

Braid’s CSS reset must evaluate before any Braid component.

When using Braid, set [`entrySideEffects`](../configuration.md#entrysideeffects) so sku imports the reset before any consumer module:

```ts
import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  buildType: 'ssr',
  entrySideEffects: ['braid-design-system/reset'],
} satisfies SkuConfig;
```

## Browser-only libraries

Libraries that touch `window` (for example analytics SDKs) throw during Document SSR.
Construct them in client `getReactContext`.
Return a stub on the server, or omit the field.
Read them from a small `useEffect` wrapper via `useReactContext()`:

::: code-group

```tsx [client.tsx]
import { defineClientEntry } from 'sku/runtime';

import { createAnalytics } from './analytics';
import type server from './server';

const client = defineClientEntry<typeof server>()({
  getReactContext() {
    return { analytics: createAnalytics() };
  },
});

export default client;
```

```tsx [server.tsx]
import { defineServerEntry } from 'sku/runtime';

const server = defineServerEntry({
  getReactContext() {
    return { analytics: null };
  },
});

export default server;
```

```tsx [Analytics.tsx]
import { useEffect } from 'react';

import { useReactContext } from './skuContext';

export const Analytics = () => {
  const { analytics } = useReactContext();

  useEffect(() => {
    analytics?.trackPageView();
  }, [analytics]);

  return null;
};
```

:::

Mount `<Analytics />` in the root layout.

## See also

- [Request entries](./entries.md) — getters and entry shapes
- [Routing](./routing.md) — root layout and pages
- [Data loading](./data-loading.md) — render-time fetch and router context
- [Multi-language](./multi-language.md) — Vocab in the root layout
- [Error pages → Errors above the router](./error-pages.md#errors-above-the-router) — route boundaries do not cover `SkuProvider`
- [Runtime API](./runtime-api.md) — `createSkuContexts` and related helpers
