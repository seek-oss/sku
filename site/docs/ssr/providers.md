# App Wrapper / Providers

`AppWrapper` is a React component `ComponentType<{ children }>` for **providers only**.
Not page layout or HTML.
sku mounts it **inside** the router as a pathless parent layout so it may use React Router hooks (`useLocation`, `useParams`, etc.).

Render tree:

```
Document
  └── RouterProvider / StaticRouterProvider
        └── sku pathless layout   ← AppWrapper (if returned) + Outlet
              └── consumer routes
```

This is your opportunity to define Providers that may differ in implementation, or have different dependencies between server and client.
For example, an API client might use different methods to make requests so the same Provider may create a different client for each environment.

Return `AppWrapper` from `onRequest` (server) and/or `onHydrate` (client) — see [Request entries](./entries.md).

**Braid apps:** import `braid-design-system/reset` before any module that touches Braid on the **server** graph (for example at the top of `serverEntry`, and any early-imported loader/page that pulls Braid).
On `sku start`, Vite’s SSR evaluation order can differ from production and may throw “Braid components imported before reset” if reset only lives in a later-imported client/App module.
Sku does **not** auto-inject Braid reset into the SSR server entry — Braid is optional per app.

**Browser-only providers:** do not mount providers that construct against `window` (analytics SDKs, etc.) in the routes render tree.
Prefer injecting server- or client-specific clients through providers in the `AppWrapper`. See [data loading](./data-loading.md).

`onRequest` may also return:

- `language` — configured language **name** (or `en-PSEUDO`) for **server** Document vocab-chunk registration only — see [Multi-language](./multi-language.md)
- `clientContext` — JSON-serialisable context the server can provide to the client.

**Warning:** clientContext is created and sent after shell-ready, and should not be used for sending data that may not be available until after the full document has rendered.

A consumer root `ErrorBoundary` does **not** catch errors thrown while rendering `AppWrapper` itself (the injected parent sits above consumer routes). See [Error pages](./error-pages.md).

```tsx
import { VocabProvider } from '@vocab/react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router';
import type { SkuSsrOnRequest } from 'sku';

export const onRequest: SkuSsrOnRequest = ({ request }) => {
  const language = resolveLocaleFromRequest(request);

  return {
    language,
    AppWrapper: ({ children }: { children: ReactNode }) => {
      const { pathname } = useLocation();
      const activeLanguage = resolveLocaleFromPathname(pathname) ?? language;
      return (
        <VocabProvider language={activeLanguage}>{children}</VocabProvider>
      );
    },
  };
};
```
