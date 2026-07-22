# Data loading

Prefer **render-time** data loading in React for page content:

1. Inject an env-specific API / clients via `AppWrapper` from `onRequest` / `onHydrate` — see [App Wrapper / Providers](./providers.md).
2. Fetch in the React tree with Suspense (for example `useQuery`) so the same components work on SSR and client navigations.

That keeps shared UI portable without per-app loader wiring and fits streaming Document + isomorphic backends.

Reach for React Router **loaders** when you need to:

- start work before the suspending subtree renders (avoid a deeply nested waterfall), or
- issue a real **document** `redirect()` or response headers (`Cache-Control`, `Set-Cookie`, …) — see [Response headers](#response-headers)

[\<Navigate /\>](https://reactrouter.com/api/components/Navigate) and [useNavigate()](https://reactrouter.com/api/hooks/useNavigate) are browser controls and will **not** create a document HTTP redirect. Use a loader `redirect()` when the response must be a real redirect.

Loaders receive a Fetch `Request`, **not** Express `req`.

**Migration Consideration:** Apps that need a complex server-side only loader experience should reach out through support channels to discuss their use-case

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
