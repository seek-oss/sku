# Multi-language / Localisation

:::danger Experimental — not for production
Managed Data Mode SSR is available for evaluation and testing. Do not use it in production yet; the API and behaviour may change.
In the meantime, continue using [Webpack SSR](./webpack-ssr.md).
:::

When `languages` is configured, SSR can preload the active language chunk (for example `en-translations`) on the initial document so translated text is available without a delayed download.

## Preload the language chunk

Export `getLanguage` from the server entry so it returns a name from config `languages` (or `en-PSEUDO`):

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

If `getLanguage` is omitted, no language chunk is preloaded and text may load later.

## VocabProvider in the root layout

Wrap your UI in `VocabProvider` in the [root layout](./providers.md#root-layout-for-providers).
Locale must track client navigation, so re-derive it the same way in the layout (URL or cookies) with React Router hooks — or seed it through `clientContext`:

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

For Vocab setup (`languages` config, `.vocab` folders, translation workflow), see [Multiple languages](../multi-language.md).

## Multiple paths per page / languages in path

Some URL schemes serve the same page at more than one path — for example `/about` for a default language and `/fr/about` when the language is nested in the path.

React Router matches on the full path and does not let one route declare multiple paths.
Define the page once, then register a separate route object for each path:

```tsx
// src/routes.tsx
import type { SkuRouteObject } from 'sku';

import { RootLayout } from './RootLayout';

const pageLazy = () => import('./pages/page/page');

export const routes: SkuRouteObject[] = [
  {
    Component: RootLayout,
    children: [
      { path: 'page', lazy: pageLazy },
      { path: 'fr/page', lazy: pageLazy },
    ],
  },
];
```

Prefer listing supported prefixes over a dynamic `:lang` segment — a dynamic segment would also match unsupported prefixes.

## See also

- [Providers](./providers.md#root-layout-for-providers) — pathless root layout
- [Request entries](./entries.md#getlanguage) — `getLanguage`
- [Routing](./routing.md) — route composition
- [Multiple languages](../multi-language.md) — Vocab config and workflow
