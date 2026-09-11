# Data loading

> [!CAUTION]
> Experimental — not for production.
> Managed Data Mode SSR is available for evaluation and testing. Do not use it in production yet. The API and behaviour may change.
> Until then, use [Webpack SSR](./webpack-ssr.md).

sku supports two data-loading paths for Managed Data Mode SSR:

- **Render-time** fetching in the React tree (Suspense, client libraries such as Apollo) during document SSR and after hydration
- React Router **loaders** and **actions** on page modules, including document `redirect()`, response headers, and optional dual-entry [`getRouterContext`](#router-context)

## Three value channels

sku has three channels that pass request-scoped values into your app.

### Client Context

Client context is JSON-serialisable data that the server shares with the client.

Define it with [`getClientContext`](./entries.md#getclientcontext).
Read it with [`useClientContext()`](./providers.md#typed-hooks).

sku passes this value from the server to the client.
sku drops object keys whose value is `undefined`.
sku replaces `undefined` array elements with `null`.

> [!TIP] Initial Context Only
> Client context is the initial context for your app.
> It does **not** update when users navigate between pages or load new data.

### React Context

React context holds values that may differ on the server and the client during React rendering.

Define it with [`getReactContext`](./entries.md#getreactcontext).
Read it with [`useReactContext()`](./providers.md#typed-hooks).

For example, an API client that differs between server and client.

### Router Context

sku passes router context to React Router loaders, actions, and route middleware.

Define it with [`getRouterContext`](./entries.md#getroutercontext).
Read it with [`context.get()`](#router-context).

## Render-time for page content

Use **render-time** data loading in React for page content.
Shared UI stays portable.
You do not configure loaders in each app for that UI.

1. Pass environment-specific clients via dual-entry [`getReactContext`](./providers.md#pass-values-into-react). Pass serialisable seeds via [`getClientContext`](./entries.md#getclientcontext).
2. Mount isomorphic providers (same on server and client) in your [root layout](./providers.md#root-layout-for-providers). Read values with [`useReactContext()`](./providers.md#typed-hooks) or [`useClientContext()`](./providers.md#typed-hooks).
3. Fetch in the React tree with Suspense (for example `useQuery`) so the same components work on SSR and client navigations.

sku does not support React Server Components.
React [`cache()`](https://react.dev/reference/react/cache) can still memoize work per request during document SSR.

## When to use loaders

Use React Router **loaders** when you need to:

- start work before the suspending subtree renders (avoid a deeply nested waterfall)
- issue a real document `redirect()` or response headers (`Cache-Control`, `Set-Cookie`, …)
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

If you need a complex server-only loader, contact [support](../support.md) to discuss the use case.

## Using router context

Use [`getRouterContext`](./entries.md#getroutercontext) to pass context to React Router loaders, actions, and route middleware.

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
> Prefer to resolve values to something both server and client can supply.
> Raw request objects are not available on client navigations.

## Response headers

When sku streams HTML (not a short-circuit redirect), it forwards loader and action headers onto the Express response.
It then applies sku headers (`Content-Type`, CSP).

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

When a client cache must survive the stream (Apollo Client), use render-time queries.
Pair them with a streaming data transport over [`useInsertHtml`](./runtime-api.md#useinserthtml) from `sku/runtime`.
sku provides the injection seam.
Your app provides the client and the transport.
sku ships no Apollo dependency.

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
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body>
          <Outlet />
        </body>
      </html>
    </ApolloProvider>
  );
};
```

sku serialises queries that run during document SSR (for example `useSuspenseQuery`) into the stream.
They populate the browser cache on hydrate.
They must not refetch.
Queries issued after hydration (client navigation) still fetch normally.

sku does not support loader-transported Apollo query refs (`apolloLoader` / `preloadQuery`).
Use render-time queries under the transport instead.
Drop two-pass `getDataFromTree`.
It is incompatible with streaming Document SSR.

## See also

- [Three value channels](#three-value-channels) — `getClientContext` vs `getReactContext` vs `getRouterContext`
- [Providers](./providers.md) — `createSkuContexts` / `useClientContext()` and root layout
- [Request entries](./entries.md#getroutercontext) — `getRouterContext` shapes
- [Routing](./routing.md#when-to-use-loaders) — loaders on page modules
- [Runtime API](./runtime-api.md#useinserthtml) — `useInsertHtml`
- [CSP](./csp.md) — nonce for injected scripts
- [Middleware](./middleware.md) — attach values on Express `req`
