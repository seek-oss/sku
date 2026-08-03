# Error pages

:::danger Experimental — not for production
SSR with Managed Data Mode is available for evaluation and testing. Do not use it in production yet; the API and behaviour may change.
In the meantime, continue using [Webpack SSR](./webpack-ssr.md).
:::

Route errors (loader failures, thrown `data()`, `404`, and `405` when a mutation hits a route without an `action`) render the nearest route `ErrorBoundary`.
sku streams the document with the matching status code.

Customize with [React Router Error Boundaries](https://reactrouter.com/how-to/error-boundary):

::: code-group

```tsx [routes.tsx]
import type { SkuRouteObject } from 'sku';

import { RootLayout } from './RootLayout';
import { ErrorBoundary } from './ErrorBoundary'; // [!code highlight]
import { homeRoute } from './pages/home/route';

export const routes: SkuRouteObject[] = [
  {
    Component: RootLayout,
    ErrorBoundary, // [!code highlight]
    children: [homeRoute],
  },
];
```

```tsx [ErrorBoundary.tsx]
import { isRouteErrorResponse, Outlet, useRouteError } from 'react-router';

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

A root route `ErrorBoundary` does not catch errors thrown above the router (including `SkuProvider`). See [Providers](./providers.md).
