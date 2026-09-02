# Providers and request context

> [!CAUTION]
> Experimental — not for production.
> Managed Data Mode SSR is available for evaluation and testing. Do not use it in production yet; the API and behaviour may change.
> In the meantime, continue using [Webpack SSR](./webpack-ssr.md).

Pass request-scoped values into React with typed hooks.
Mount isomorphic providers (Braid, Vocab, Apollo) and shared UI in your **root layout** route.

sku mounts a `SkuProvider` outside the router:

```
Document
 └── SkuProvider   ← site, clientContext, reactContext
      └── Router
           └── root layout route   ← Vocab, Apollo, shared UI
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
- `useReactContext()` — env-differing values from `getReactContext` (may differ on server vs client)

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

**Env-differing values** (API clients, server-only links) — set [`getReactContext`](./entries.md#getreactcontext) on **both** entries and read with `useReactContext()`:

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

`clientContext` and `reactContext` are set for the page load and do not change across client navigations.
Anything that must track navigation (for example locale from the URL) belongs in the route tree.

For loader/action/route-middleware dependency injection, see [Data loading → Router context](./data-loading.md#router-context).

## Root layout for providers

Wrapping that needs React Router hooks belongs in your own root layout in `routes.tsx`.
You can add a **pathless** layout to wrap child routes without adding a URL segment.
The same root layout can be used for shared UI such as a header or footer.

::: code-group

```tsx [RootLayout.tsx]
import { BraidProvider } from 'braid-design-system';
import seekJobs from 'braid-design-system/themes/seekJobs';
import { Outlet, useLocation } from 'react-router';

export const RootLayout = () => {
  const language = useLanguage();

  return (
    <BraidProvider theme={seekJobs}>
      <Header />
      <Outlet />
      <Footer />
    </BraidProvider>
  );
};
```

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

:::

Env-specific **values** (API clients, etc.) come from dual-entry `getReactContext`.
Isomorphic **provider components** mount in the root layout and read those values with hooks — for example Vocab keyed on the URL, or Apollo via `useReactContext()`.
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
Construct them in client `getReactContext` and return a stub (or omit the field) on the server.
Consume from a small `useEffect` wrapper via `useReactContext()`:

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
- [Routing](./routing.md) — pathless root layout and pages
- [Data loading](./data-loading.md) — render-time fetch and router context
- [Multi-language](./multi-language.md) — Vocab in the root layout
- [Error pages → Errors above the router](./error-pages.md#errors-above-the-router) — route boundaries do not cover `SkuProvider`
- [Runtime API](./runtime-api.md) — `createSkuContexts` and related helpers
