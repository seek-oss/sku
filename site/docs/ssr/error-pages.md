# Error pages

Route errors (loader failures, thrown `data()`, `404`, and `405` when a mutation hits a route without an `action`) are React Router error responses.
sku streams the document with `context.statusCode` and renders the nearest route `ErrorBoundary` (or React Router’s default error UI).
Customize content with [React Router Error Boundaries](https://reactrouter.com/how-to/error-boundary).

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
// src/routes.tsx — attach ErrorBoundary on the root route
import type { RouteObject } from 'react-router';

import { ErrorBoundary, RootLayout } from './RootLayout.js';
import { homeRoute } from './pages/home/route.js';

export const routes: RouteObject[] = [
  {
    path: '/',
    Component: RootLayout,
    ErrorBoundary,
    children: [homeRoute],
  },
];
```

A consumer root `ErrorBoundary` does **not** catch errors thrown while rendering `AppWrapper` itself — the injected parent sits above consumer routes. See [App Wrapper / Providers](./providers.md).
