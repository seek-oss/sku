# Multi-language / Localisation

:::danger Experimental — not for production
Managed Data Mode SSR is available for evaluation and testing. Do not use it in production yet; the API and behaviour may change.
In the meantime, continue using [Webpack SSR](./webpack-ssr.md).
:::

Managed Data Mode SSR supports the common multi-language approach using Vocab. See [Multiple languages](../multi-language.md) for setup and workflow.

When [`languages`](../configuration.md#languages) is configured, SSR can preload the active language chunk (for example `en-translations`) on the initial document so translated text is available without a delayed download.

## Preload the language chunk

Export [`getLanguage`](./entries.md#getlanguage) from the server entry so it returns a name from config [`languages`](../configuration.md#languages) (or `en-PSEUDO`):

```tsx
// src/server.tsx
import { defineServerEntry } from 'sku/runtime';

const server = defineServerEntry({
  getLanguage({ req }) {
    return req.path.startsWith('/th') ? 'th-TH' : 'en';
  },
});

export default server;
```

If [`getLanguage`](./entries.md#getlanguage) is omitted, no language chunk is preloaded and text may load later.

## VocabProvider in the root layout

Wrap your UI in `VocabProvider` in the [root layout](./providers.md#root-layout-for-providers), and pass the active language so it stays in sync on client navigation.

If language is in the path, derive it from the router (as in the example below). If it comes from a cookie or other context, read that in the layout the same way.

```tsx
// src/RootLayout.tsx
import { VocabProvider } from '@vocab/react';
import { Outlet, useLocation } from 'react-router';

function languageFromPath(pathname: string) {
  return pathname.startsWith('/th') ? 'th-TH' : 'en';
}

export const RootLayout = () => {
  const { pathname } = useLocation();

  return (
    <VocabProvider language={languageFromPath(pathname)}>
      <Outlet />
    </VocabProvider>
  );
};
```

For Vocab setup ([`languages`](../configuration.md#languages) config, `.vocab` folders, translation workflow), see [Multiple languages](../multi-language.md).

## Languages in the path

Some URL schemes serve the same page at more than one path — for example `/about` for one language and `/fr/about` for another.

React Router matches one path per route object, so you need a separate route for each concrete path.

Prefer listing supported prefixes over a dynamic `:lang` segment — a param would also match unsupported prefixes.

You can duplicate route objects by hand, or use `expandRoutePath` below.

### expandRoutePath

Export optional `expandRoutePath` from [`routesEntry`](../configuration.md#routesentry). sku clones the route for each returned path:

```tsx
// src/routes.tsx
import type { ExpandRoutePath, SkuRouteObject } from 'sku/runtime';

import { RootLayout } from './RootLayout';

export const expandRoutePath: ExpandRoutePath = ({ path }) => {
  if (path === 'about') {
    return ['about', 'fr/about'];
  }
  return [path];
};

export const routes: SkuRouteObject[] = [
  {
    Component: RootLayout,
    children: [{ path: 'about', lazy: () => import('./pages/about/about') }],
  },
];
```

`expandRoutePath` is not a substitute for [`getLanguage`](./entries.md#getlanguage) — that still selects the Vocab chunk on the Document.

Hand-duplicating is fine for more control. Do not share one `const pageLazy = () => import(…)` across copies — that breaks automatic `modulepreload`. Prefer `expandRoutePath`, or give each duplicate its own inline `lazy`.

For nested routes, index homes, and per-site expansion, see [Routing → Multiple paths with expandRoutePath](./routing.md#multiple-paths-with-expandroutepath).

## See also

- [Providers](./providers.md#root-layout-for-providers) — pathless root layout
- [Request entries](./entries.md#getlanguage) — `getLanguage`
- [Routing](./routing.md) — route composition
- [Multiple languages](../multi-language.md) — Vocab config and workflow
