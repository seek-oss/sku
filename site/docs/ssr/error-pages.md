# Error pages

:::danger Experimental — not for production
Managed Data Mode SSR is available for evaluation and testing. Do not use it in production yet; the API and behaviour may change.
In the meantime, continue using [Webpack SSR](./webpack-ssr.md).
:::

sku turns route failures into document responses: the nearest React Router `ErrorBoundary` renders the UI, and the streamed response uses the matching HTTP status code.

## Add an ErrorBoundary

When a loader fails, a route throws, or the URL does not match, readers should see your UI rather than a blank document.
Attach an `ErrorBoundary` on a layout route so every child under it shares the same failure UI.

sku uses [React Router Error Boundaries](https://reactrouter.com/how-to/error-boundary):

::: code-group

```tsx [routes.tsx]
import type { SkuRouteObject } from 'sku/runtime';

import { ErrorBoundary } from './ErrorBoundary';
import { RootLayout } from './RootLayout';

export const routes: SkuRouteObject[] = [
  {
    Component: RootLayout,
    ErrorBoundary, // [!code highlight]
    children: [{ index: true, lazy: () => import('./pages/home/home') }],
  },
];
```

```tsx [ErrorBoundary.tsx]
import { isRouteErrorResponse, useRouteError } from 'react-router';

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <main>
        <h1>
          {error.status} {error.statusText}
        </h1>
        <p>{typeof error.data === 'string' ? error.data : null}</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Something went wrong</h1>
    </main>
  );
}
```

:::

Use `isRouteErrorResponse` when you want different copy for HTTP-style failures (`404`, `data()` responses) versus unexpected throws.

## What gets an ErrorBoundary

An `ErrorBoundary` on a route catches failures that happen while matching or rendering that route and its descendants.
That includes:

- loader failures and thrown `data()` responses
- `404` for unmatched routes
- `405` when a mutation hits a route without an `action`
- sync `Component` throws

Put the boundary high enough in the tree (often the root layout) so nested pages inherit it.
You can also nest boundaries when a section needs its own failure UI.

### Suspense failures during document SSR

Render-time data loading can reject a Suspense boundary while sku is still streaming the document.
When that happens, sku aborts the first stream and re-renders with the error on the static handler context.
The nearest `ErrorBoundary` then produces the HTML response (status `500` unless the error is a route error response).

## Errors above the router

A root route `ErrorBoundary` only covers work inside the router.
It does not catch errors thrown above the router, including inside sku’s always-on `SkuProvider` (see the tree on [Providers](./providers.md)).

Failures at that level fall through to Express.
They are hard to turn into a stylised error page for readers — your route `ErrorBoundary` never gets a chance to render.

Mount isomorphic and fallible providers in your [root layout](./providers.md#root-layout-for-providers) so the route boundary can cover them.

## See also

- [Routing](./routing.md) — page modules and route tree
- [Providers](./providers.md) — `SkuProvider` sits outside the router
- [Data loading](./data-loading.md) — loaders and `data()` responses
