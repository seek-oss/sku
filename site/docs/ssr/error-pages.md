# Error pages

:::danger Experimental — not for production
Managed Data Mode SSR is available for evaluation and testing. Do not use it in production yet; the API and behaviour may change.
In the meantime, continue using [Webpack SSR](./webpack-ssr.md).
:::

Route errors render the nearest route `ErrorBoundary`, and sku streams the document with the matching status code.

That covers:

- loader failures and thrown `data()` responses
- `404` for unmatched routes
- `405` when a mutation hits a route without an `action`

Sync Component throws are recovered the same way.
If a Suspense boundary rejects while sku is waiting for the document stream to finish, sku aborts the first stream and re-renders with the error on the static handler context so the nearest `ErrorBoundary` produces the HTML response (status `500` unless the error is a route error response).

## Add an ErrorBoundary

Customize with [React Router Error Boundaries](https://reactrouter.com/how-to/error-boundary):

::: code-group

```tsx [routes.tsx]
// src/routes.tsx
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
// src/ErrorBoundary.tsx
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

## Errors above the router

A root route `ErrorBoundary` does not catch errors thrown above the router (including `SkuProvider`).
See [Providers](./providers.md#errors-above-the-router).

## See also

- [Routing](./routing.md) — page modules and route tree
- [Providers](./providers.md) — `SkuProvider` sits outside the router
- [Data loading](./data-loading.md) — loaders and `data()` responses
