# Data loading

> [!CAUTION]
> Experimental — not for production.
> Managed Data Mode SSR is available for evaluation and testing. Do not use it in production yet; the API and behaviour may change.
> In the meantime, continue using [Webpack SSR](./webpack-ssr.md).

sku supports two data-loading paths for Managed Data Mode SSR:

- **Render-time** fetching in the React tree (Suspense, client libraries such as Apollo) during document SSR and after hydration
- React Router **loaders** and **actions** on page modules, including document `redirect()`, response headers, and optional dual-entry [`getRouterContext`](#router-context)

## Request Context

sku has three channels for including request-scoped values into your app.

### Client Context

Serializable context shared between Server and Client

Define using [`getClientContext`](./entries.md#getclientcontext).
Read with [`useClientContext()`](./providers.md#typed-hooks).

Context must be JSON-serialisable and is automatically passed from server to client.

> [!TIP] Initial Context Only
> The client context serves as the initial context for your app.
> It does **not** update as users navigate between pages or load new data.

### React Context

The server/client specific context for React rendering.

Define using [`getReactContext`](./entries.md#getreactcontext).
Read with [`useReactContext()`](./providers.md#typed-hooks).

For example, an API client that differs between server and client.

### Router Context

Context provided to React Router loaders, actions, and route middleware.

Define using [`getRouterContext`](./entries.md#getroutercontext).
Read with [`context.get()`](#router-context).

## Render-time for page content

Use **render-time** data loading in React for page content.
That keeps shared UI portable without per-app loader wiring.

1. Pass env-specific clients via dual-entry [`getReactContext`](./providers.md#pass-values-into-react) (and serialisable seeds via [`getClientContext`](./entries.md#getclientcontext)).
2. Mount isomorphic providers in your [root layout](./providers.md#root-layout-for-providers) and read values with [`useReactContext()`](./providers.md#typed-hooks) / [`useClientContext()`](./providers.md#typed-hooks).
3. Fetch in the React tree with Suspense (for example `useQuery`) so the same components work on SSR and client navigations.

sku does not support React Server Components.
React [`cache()`](https://react.dev/reference/react/cache) can still memoize work per request during document SSR.

## When to use loaders

Reach for React Router **loaders** when you need to:

- start work before the suspending subtree renders (avoid a deeply nested waterfall), or
- issue a real document `redirect()` or response headers (`Cache-Control`, `Set-Cookie`, …), or
- inject values into loaders via optional dual-entry [`getRouterContext`](#router-context)

[`<Navigate />`](https://reactrouter.com/api/components/Navigate) and [`useNavigate()`](https://reactrouter.com/api/hooks/useNavigate) are browser controls and will **not** create a document HTTP redirect.
Use a loader `redirect()` when the response must be a real redirect:

```tsx
// src/pages/legacy/legacy.tsx
import { redirect } from 'react-router';

export function loader() {
  return redirect('/new-home');
}

export function Component() {
  return null;
}
```

Loaders receive a Fetch `Request`, not Express `req`.
Express `req` is available to [entry getters](./entries.md) and optional server `getRouterContext`.

Need a complex server-only loader experience? Reach out via [support](../support.md) to discuss the use case.

## Using router context

Use [getRouterContext](./entries.md#getroutercontext) to provide context to React Router loaders, actions and route middleware.

If you use it, define it on **both** server and client entries with the same `createContext` keys:

```tsx
// src/userIdContext.ts
import { createContext } from 'react-router';

export const userIdContext = createContext<string | null>(null);
```

::: code-group

```tsx [server.tsx]
import { RouterContextProvider } from 'react-router';
import { defineServerEntry } from 'sku/runtime';

import { userIdContext } from './userIdContext';

const server = defineServerEntry({
  getClientContext({ req }) {
    return { userId: req.user?.id ?? null };
  },
  getRouterContext({ clientContext }) {
    const ctx = new RouterContextProvider();
    ctx.set(userIdContext, clientContext?.userId ?? null);
    return ctx;
  },
});

export default server;
```

```tsx [client.tsx]
import { RouterContextProvider } from 'react-router';
import { defineClientEntry } from 'sku/runtime';

import type server from './server';
import { userIdContext } from './userIdContext';

const client = defineClientEntry<typeof server>()({
  getRouterContext({ clientContext }) {
    const ctx = new RouterContextProvider();
    ctx.set(userIdContext, clientContext?.userId ?? null);
    return ctx;
  },
});

export default client;
```

:::

```tsx
// loader — works on document SSR and after client navigation
import type { LoaderFunctionArgs } from 'react-router';

import { userIdContext } from './userIdContext';

export async function loader({ context }: LoaderFunctionArgs) {
  return { userId: context.get(userIdContext) };
}
```

> [!WARNING] Avoid putting Express req in RouterContextProvider
> Try to resolve values to something both server and client can supply.  
> Raw request objects are not available on client navigations.

## Response headers

When sku streams HTML (not a short-circuit redirect), it forwards loader/action headers onto the Express response, then applies sku-owned headers (`Content-Type`, CSP).

Set caching and cookies with React Router’s `data()` / header APIs:

```tsx
import { data } from 'react-router';

export async function loader() {
  return data(
    { ok: true },
    {
      headers: {
        'Cache-Control': 'private, max-age=0',
        'Set-Cookie': 'session=1; Path=/; HttpOnly',
      },
    },
  );
}
```

## Apollo streaming hydration

When a client cache must survive the stream (Apollo Client), pair render-time queries with a streaming data transport over [`useInsertHtml`](./runtime-api.md#useinserthtml) from `sku/runtime`.
sku owns the injection seam; your app owns the client and transport — sku ships no Apollo dependency.

```tsx
// src/ApolloProvider.tsx — transport only (isomorphic)
import { WrapApolloProvider } from '@apollo/client-react-streaming';
import { buildManualDataTransport } from '@apollo/client-react-streaming/manual-transport';
import { useInsertHtml } from 'sku/runtime';

export const ApolloProvider = WrapApolloProvider(
  buildManualDataTransport({ useInsertHtml }), // [!code highlight]
);
```

Supply a **different** `makeClient` from each entry’s `getReactContext`.
On the **server** entry only, pass the CSP nonce onto injected scripts (see [CSP](./csp.md)).
Mount the isomorphic Apollo provider in the root layout via `useReactContext()`:

::: code-group

```tsx [server.tsx]
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { defineServerEntry, getCspNonce } from 'sku/runtime';

const server = defineServerEntry({
  getReactContext() {
    return {
      makeClient: () =>
        new ApolloClient({
          cache: new InMemoryCache(),
          link: serverLink,
        }),
      extraScriptProps: { nonce: getCspNonce() }, // [!code highlight]
    };
  },
});

export default server;
```

```tsx [client.tsx]
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { defineClientEntry } from 'sku/runtime';

import type server from './server';

const client = defineClientEntry<typeof server>()({
  getReactContext() {
    return {
      makeClient: () =>
        new ApolloClient({
          cache: new InMemoryCache(),
          link: httpLink,
        }),
    };
  },
});

export default client;
```

:::

```tsx
// src/RootLayout.tsx
import { Outlet } from 'react-router';

import { ApolloProvider } from './ApolloProvider';
import { useReactContext } from './skuContext';

export const RootLayout = () => {
  const reactContext = useReactContext();

  return (
    <ApolloProvider
      makeClient={reactContext.makeClient}
      extraScriptProps={
        'extraScriptProps' in reactContext
          ? reactContext.extraScriptProps
          : undefined
      }
    >
      <Outlet />
    </ApolloProvider>
  );
};
```

Queries that run during document SSR (for example `useSuspenseQuery`) are serialized into the stream and populate the browser cache on hydrate — they must not refetch.
Queries issued after hydration (client navigation) still fetch normally.

Loader-transported Apollo query refs (`apolloLoader` / `preloadQuery`) are unsupported — use render-time queries under the transport instead.
Drop two-pass `getDataFromTree`; it is incompatible with streaming Document SSR.

## See also

- [Three value channels](#three-value-channels) — `getClientContext` vs `getReactContext` vs `getRouterContext`
- [Providers](./providers.md) — `createSkuContexts` / `useClientContext()` and root layout
- [Request entries](./entries.md#getroutercontext) — `getRouterContext` shapes
- [Routing](./routing.md#when-to-use-loaders) — loaders on page modules
- [Runtime API](./runtime-api.md#useinserthtml) — `useInsertHtml`
- [CSP](./csp.md) — nonce for injected scripts
- [Middleware](./middleware.md) — attach values on Express `req`
