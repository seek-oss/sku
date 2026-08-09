# Providers and request context

:::danger Experimental — not for production
Managed Data Mode SSR is available for evaluation and testing. Do not use it in production yet; the API and behaviour may change.
In the meantime, continue using [Webpack SSR](./webpack-ssr.md).
:::

Pass request-scoped values into React with typed hooks.
Mount isomorphic providers (Braid, Vocab, Apollo, chrome) in your **root layout** route.

sku mounts a `SkuProvider` outside the router:

```
Document
  └── SkuProvider   ← site, clientContext, reactContext
        └── Router
              └── root layout route   ← Vocab, Apollo, chrome
                    └── pages
```

## Typed hooks

Create hooks bound to your entry objects:

```tsx
// src/App/ssrContext.ts
import { createSkuContexts } from 'sku/runtime';

import type client from './client.js';
import type server from './server.js';

export const { useSite, useClientContext, useReactContext } = createSkuContexts<
  typeof server,
  typeof client
>();
```

- `useSite()` — active site name
- `useClientContext()` — serialisable content from `getClientContext` (shared with the browser)
- `useReactContext()` — env-differing values from `getReactContext` (may differ on server vs client)

## Pass values into React

**Serialisable content** (theme, user id) — set `getClientContext` on the server entry and read with `useClientContext()`:

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

**Env-differing values** (API clients, server-only links) — set `getReactContext` on **both** entries and read with `useReactContext()`:

::: code-group

```tsx [server.tsx]
getReactContext() {
  return { makeClient: serverMakeClient };
}
```

```tsx [client.tsx]
getReactContext() {
  return { makeClient: clientMakeClient };
}
```

:::

`clientContext` and `reactContext` are set for the page load and do not change across client navigations.
Anything that must track navigation (for example locale from the URL) belongs in the route tree.

For loader/action dependency injection, see [Data loading → Router context](./data-loading.md#router-context).

## Root layout for providers

Wrapping that needs React Router hooks belongs in your own root layout in `routes.tsx`.
Prefer a **pathless** layout over `path: '/'`:

```tsx
// src/App/RootLayout.tsx
import 'braid-design-system/reset';

import { BraidProvider } from 'braid-design-system';
import seekJobs from 'braid-design-system/themes/seekJobs';
import { Outlet } from 'react-router';

export const RootLayout = () => (
  <BraidProvider theme={seekJobs}>
    <Outlet />
  </BraidProvider>
);
```

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

Env-specific **values** (API clients, etc.) come from dual-entry `getReactContext`.
Isomorphic **provider components** mount in the root layout and read those values with hooks — for example Vocab keyed on the URL, or Apollo via `useReactContext()`. See [Multi-language](./multi-language.md) and [Apollo streaming hydration](./data-loading.md#apollo-streaming-hydration).

## Entry helpers and typing

Wrap each request entry with `defineServerEntry` / `defineClientEntry` from `sku/runtime` so TypeScript can infer sibling types.
Prefer `defineClientEntry<typeof server>()({ … })` so client callbacks get `Site` / `ClientContext` from the server entry.

Do not annotate getters with the loose public aliases (`SkuGetSite`, …) — they widen returns to `string` and defeat literal inference.

Full getter reference: [Request entries](./entries.md).

## Notes

**Braid:** import `braid-design-system/reset` before any module that touches Braid on the **server** graph (for example at the top of the root layout).
On `sku start`, Vite’s SSR evaluation order can differ from production.
sku does not auto-inject Braid reset.

**Browser-only libraries:** construct them in client `getReactContext` and consume from the root layout or a small `useEffect` wrapper via `useReactContext()`.

A root route `ErrorBoundary` does not catch errors thrown above the router (including `SkuProvider`). See [Error pages](./error-pages.md).

Do not reach for Async Local Storage or module-level mutable state set by `onHydrate` for request values — use the hooks above.
