# Providers and request context

Sku always mounts **`SkuSsrProvider`** outside the router:

```
Document
  └── SkuSsrProvider   ← always (site, clientContext, reactContext)
        └── Router
              └── root layout route   ← Vocab, Apollo wrap, chrome
                    └── pages
```

Apps do **not** export a dual-entry `Providers` component.
Request-scoped values reach React through typed hooks from [`createSkuSsrContexts`](#typed-hooks-createskussrcontexts); isomorphic wrapping that needs the router lives in your [root layout route](#router-aware-wrapping-is-a-route).

## Three value channels

| Channel                      | Entry getter       | React / RR consumer        | Same on server & client?           | Serialised?             |
| ---------------------------- | ------------------ | -------------------------- | ---------------------------------- | ----------------------- |
| Wire / isomorphic React seed | `getClientContext` | `useClientContext()`       | Yes (by construction)              | Yes → hydrate bootstrap |
| Env-differing React values   | `getReactContext`  | `useReactContext()`        | **May differ**                     | No                      |
| Loader / action context      | `getRouterContext` | `context.get()` in loaders | Same keys; construction may differ | No                      |

React Router 8 has no component-level hook for router context, so values needed by components belong in `useClientContext` / `useReactContext` or the root layout — not `getRouterContext`.

## Typed hooks (`createSkuSsrContexts`)

Pass `typeof` your default-exported entry objects — no hand-written `Site` / `ClientContext` / `ReactContext` aliases required:

```tsx
// src/App/ssrContext.ts
import type server from '../server';
import type client from '../client';
import { createSkuSsrContexts } from 'sku/ssr';

export const { useSite, useClientContext, useReactContext } =
  createSkuSsrContexts<typeof server, typeof client>();
```

- `useSite()` — typed as the return of server `getSite` (or `string` when `getSite` is omitted / sole config site)
- `useClientContext()` — serialisable seed from `getClientContext` (`undefined` when omitted)
- `useReactContext()` — env-differing bag from dual-entry `getReactContext` (union of both returns; `undefined` when omitted)

Language from `getLanguage` is inferred on the server entry object only — there is no `useLanguage` hook in v1 (Document vocab preload).

`createSkuSsrContexts` is a typed facade over the same React context module sku’s render uses (`sku/ssr`, unbundled).

## Entry objects (`defineServerEntry` / `defineClientEntry`)

Each request entry **`export default`** one object via a zero-runtime identity helper so TypeScript can infer sibling types.

`defineServerEntry` infers **Site** (`S`) from `getSite`, **Language** (`L`) from `getLanguage`, **ClientContext** (`C`) from `getClientContext`, and **ReactContext** (`R`) from `getReactContext`.
Later server getters receive `site` typed as that `Site` union.

`defineClientEntry` cannot infer `ClientContext` / `Site` from the client object alone — those values only appear as **callback inputs**. Pass **`defineClientEntry<typeof server>()({ … })`** so the helper extracts them the same way [`createSkuSsrContexts`](#typed-hooks-createskussrcontexts) does, and still infers `ReactContext` from client `getReactContext`.
(The extra `()` is required — TypeScript cannot partially infer type parameters.)
Omit the type argument and call `defineClientEntry({ … })` directly ⇒ `clientContext` is `undefined` and `site` is `string`.

**Do not annotate getters with the loose public aliases** (`SkuSsrGetSite` / `SkuSsrGetLanguage` / …) — those widen returns to `string` and defeat literal inference. Prefer letting `defineServerEntry` infer, or narrow inside the getter body.

```tsx
// src/server.tsx
import { defineServerEntry, getCspNonce } from 'sku/ssr';

const server = defineServerEntry({
  // Narrow here — do not annotate as SkuSsrGetSite (widens to string)
  getSite({ req }) {
    return req.get('x-site') === 'nz' ? 'nz' : 'au';
  },
  getLanguage({ req }) {
    return req.path.startsWith('/fr') ? 'fr' : 'en';
  },
  getClientContext({ req }) {
    return { userId: req.user?.id ?? null };
  },
  getReactContext({ site, clientContext }) {
    // site inferred as 'au' | 'nz'
    return {
      makeClient: serverMakeClient,
      extraScriptProps: { nonce: getCspNonce() },
    };
  },
  getRouterContext({ clientContext }) {
    const ctx = new RouterContextProvider();
    ctx.set(userIdContext, clientContext?.userId ?? null);
    return ctx;
  },
});
export default server;
```

```tsx
// src/client.tsx
import { defineClientEntry } from 'sku/ssr';

import type server from './server';

const client = defineClientEntry<typeof server>()({
  getReactContext() {
    return { makeClient: clientMakeClient };
  },
  getRouterContext({ clientContext }) {
    // clientContext typed from server getClientContext
    const ctx = new RouterContextProvider();
    ctx.set(userIdContext, clientContext?.userId ?? null);
    return ctx;
  },
});
export default client;
```

Later getters receive already-resolved sibling values (`site`, `clientContext`, `reactContext`) so you project instead of re-deriving.
See [Request entries](./entries.md).

## Router-aware wrapping is a route

Wrapping that needs React Router hooks or loader data belongs in your own root layout route in `routesEntry` — plain React Router + sku hooks.
Prefer a **pathless** layout route over `path: '/'`.

```tsx
// src/routes.tsx
import { VocabProvider } from '@vocab/react';
import { Outlet, useLocation } from 'react-router';
import type { SkuSsrRouteObject } from 'sku';

import { useReactContext } from './App/ssrContext';

const RootLayout = () => {
  const { pathname } = useLocation();
  const { makeClient, extraScriptProps } = useReactContext() ?? {};
  return (
    <ApolloProvider makeClient={makeClient} extraScriptProps={extraScriptProps}>
      <VocabProvider language={resolveLocaleFromPathname(pathname)}>
        <Outlet />
      </VocabProvider>
    </ApolloProvider>
  );
};

export const routes: SkuSsrRouteObject[] = [
  {
    Component: RootLayout,
    children: [homeRoute, aboutRoute],
  },
];
```

Env-specific **values** (`makeClient`, window SDKs) come from dual-entry `getReactContext`.
Isomorphic **provider components** mount in the root layout and read those values with `useReactContext()`.

## Where request-scoped values go

- **`useSite` / `useClientContext` / `useReactContext`** — page-load seeds on `SkuSsrProvider`
- **Re-derive in the route tree** — URL / loader data in the root layout for anything that must track client navigation (e.g. locale). `clientContext` and `reactContext` do not change across client navigations
- **[`getRouterContext`](./data-loading.md#router-context-getroutercontext)** — loader / action DI only

Do not reach for consumer-authored Async Local Storage or module-level mutable state set by `onHydrate`.

## Notes

**Braid apps:** import `braid-design-system/reset` before any module that touches Braid on the **server** graph (for example at the top of the root layout that mounts `BraidProvider`).
On `sku start`, Vite’s SSR evaluation order can differ from production.
Sku does **not** auto-inject Braid reset — Braid is optional per app.

**Browser-only libraries:** put construction in **client** `getReactContext` (server returns `undefined` / omits the field). Consume from the root layout or a small `useEffect` wrapper via `useReactContext()`. See [data loading](./data-loading.md).

A consumer root `ErrorBoundary` does **not** catch errors thrown while rendering above the router (including `SkuSsrProvider`). See [Error pages](./error-pages.md).
