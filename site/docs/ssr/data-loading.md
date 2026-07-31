# Data loading

Prefer **render-time** data loading in React for page content:

1. Inject an env-specific API / clients via the named `Providers` export on `serverEntry` / `clientEntry` — see [Providers](./providers.md).
2. Fetch in the React tree with Suspense (for example `useQuery`) so the same components work on SSR and client navigations.

That keeps shared UI portable without per-app loader wiring and fits streaming Document + isomorphic backends.

Reach for React Router **loaders** when you need to:

- start work before the suspending subtree renders (avoid a deeply nested waterfall), or
- issue a real **document** `redirect()` or response headers (`Cache-Control`, `Set-Cookie`, …) — see [Response headers](#response-headers), or
- advanced DI via optional dual-entry [`getContext`](#router-context-getcontext)

[\<Navigate /\>](https://reactrouter.com/api/components/Navigate) and [useNavigate()](https://reactrouter.com/api/hooks/useNavigate) are browser controls and will **not** create a document HTTP redirect. Use a loader `redirect()` when the response must be a real redirect.

Loaders receive a Fetch `Request`, **not** Express `req`.
Express `req` is available to [`onRequest({ req })`](./entries.md#onrequest) and optional server [`getContext`](./entries.md#getcontext-optional) — not as the loader `request` argument.

**Migration Consideration:** Apps that need a complex server-side only loader experience should reach out through support channels to discuss their use-case

## Router context (`getContext`)

Optional dual-entry `getContext` seeds React Router’s `RouterContextProvider` for loader/action DI:

|                    | Framework Mode                     | Sku Data Mode                                                              |
| ------------------ | ---------------------------------- | -------------------------------------------------------------------------- |
| Server seed        | Adapter `getLoadContext(req, res)` | Entry `getContext({ request, req })` into `query(..., { requestContext })` |
| Client nav loaders | Often still server (`.data`)       | Browser via `createBrowserRouter`                                          |
| Client seed        | Needed for client-only paths       | Needed for **every** client nav if context DI is used                      |

Sku is **Data Mode**. Copying only Framework Mode’s server-half adapter leaves client-nav loaders without context.
If loader context is offered at all, export `getContext` from **both** entries with the same `createContext` keys and different construction per environment.

- **Server:** once per document `query` — seed from Express middleware bag + Fetch `request`
- **Client:** every navigation / fetcher — seed from browser-visible state (`clientContext`, cookies, memory, …)
- Relation to Express [`middleware`](./middleware.md) vs RR route `middleware` vs entry `getContext`: HTTP middleware attaches platform state; `getContext` projects isomorphic values into the router; route `middleware` runs inside RR
- Relation to [`Providers`](./providers.md) (React dependencies, outside the router) vs the root layout route (router-aware wrapping) vs `getContext` (loader/action DI) — they compose; `onRequest` / `onHydrate` only cover site, language, `clientContext`, and hydrate side effects

:::warning Never put Express `req` in `RouterContextProvider`
Never put Express `req` (or other non-isomorphic platform objects) into router context.
Project **values** both sides can supply. Raw `req` is missing on client navigations.
:::

### Client navigation ≠ initial SSR location

Server `getContext` runs for the document request; client `getContext` must work for **any** later location without Express.

```tsx
// Shared key
import { createContext, RouterContextProvider } from 'react-router';
export const userIdContext = createContext<string | null>(null);

// serverEntry — from middleware-attached state
export const getContext: SkuSsrServerGetContext = ({ req }) => {
  const ctx = new RouterContextProvider();
  ctx.set(userIdContext, req.user?.id ?? null);
  return ctx;
};

// clientEntry — re-derived (e.g. from clientContext hydrate seed)
export const getContext: SkuSsrClientGetContext = ({ clientContext }) => {
  const ctx = new RouterContextProvider();
  ctx.set(
    userIdContext,
    (clientContext as { userId?: string | null })?.userId ?? null,
  );
  return ctx;
};

// loader — works on document SSR and after client nav to a different route
export async function loader({ context }: LoaderFunctionArgs) {
  return { userId: context.get(userIdContext) };
}
```

After hydrate on `/`, a client navigation to `/profile` still gets context from client `getContext` — not from Express.

See [Request entries](./entries.md#getcontext-optional) for export shapes and [Middleware](./middleware.md) for Express mount order.

## Response headers

After React Router `query()`, when sku streams HTML (not a short-circuit `Response` such as a redirect), it forwards loader/action headers from the route context onto the Express response (including multi-value headers such as `Set-Cookie`), then applies sku-owned headers (`Content-Type`, CSP).

Prefer render-time data loading (above) for page content.
Use loaders/actions when you need document redirects or response headers — set caching and cookies with React Router’s `data()` / header APIs, for example:

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

When a client cache must survive the stream (Apollo Client), pair render-time queries with a streaming data transport over [`useInsertHtml`](./entries.md#useinserthtml) from `sku/ssr`.
Sku owns the injection seam; your app owns the client and transport — sku ships **no** Apollo dependency or config.

```tsx
// src/ApolloProvider.tsx — shared by both request entries
import { WrapApolloProvider } from '@apollo/client-react-streaming';
import { buildManualDataTransport } from '@apollo/client-react-streaming/manual-transport';
import { useInsertHtml } from 'sku/ssr';

export const ApolloProvider = WrapApolloProvider(
  buildManualDataTransport({ useInsertHtml }),
);
```

Mount it as dual-entry [`Providers`](./providers.md). On the **server** entry only, pass the CSP nonce onto injected scripts (bodies are unhashable after the shell — see [CSP](./csp.md)):

```tsx
// serverEntry
import { getCspNonce } from 'sku';
import { ApolloProvider, makeClient } from './ApolloProvider';

export const Providers: SkuSsrProviders = ({ children }) => (
  <ApolloProvider
    makeClient={makeClient}
    extraScriptProps={{ nonce: getCspNonce() }}
  >
    {children}
  </ApolloProvider>
);

// clientEntry — omit extraScriptProps
export const Providers: SkuSsrProviders = ({ children }) => (
  <ApolloProvider makeClient={makeClient}>{children}</ApolloProvider>
);
```

Queries that run during document SSR (for example `useSuspenseQuery`) are serialized into the stream and populate the browser cache on hydrate — they must **not** refetch.
Queries issued after hydration (client navigation) still fetch normally.

**Unsupported:** loader-transported Apollo query refs (`apolloLoader` / `preloadQuery` from `@apollo/client-integration-react-router`).
Sku serializes loader data as JSON and promise-scrubs it, so those refs cannot survive hydration without streaming loader data — use render-time queries under the transport instead.
Drop two-pass `getDataFromTree` — it is incompatible with streaming Document SSR.
