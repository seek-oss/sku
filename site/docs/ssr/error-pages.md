# Error pages

Route errors (loader failures, thrown `data()`, `404`, and `405` when a mutation hits a route without an `action`) render the nearest route `ErrorBoundary`.
sku streams the document with the matching status code.

Customize with [React Router Error Boundaries](https://reactrouter.com/how-to/error-boundary):

```tsx
// src/RootLayout.tsx
import { isRouteErrorResponse, Outlet, useRouteError } from 'react-router';

export const RootLayout = () => <Outlet />;

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

```tsx
// src/routes.tsx
import type { SkuSsrRouteObject } from 'sku';

import { ErrorBoundary, RootLayout } from './RootLayout';
import { homeRoute } from './pages/home/route';

export const routes: SkuSsrRouteObject[] = [
  {
    Component: RootLayout,
    ErrorBoundary,
    children: [homeRoute],
  },
];
```

A root route `ErrorBoundary` does not catch errors thrown above the router (including `SkuSsrProvider`). See [Providers](./providers.md).
