# Multi-language / Localisation

When `languages` is configured, SSR uses `@vocab/vite` language chunk splitting and registers the active language chunk (e.g. `en-translations`) to be loaded as part of the initial document.

Sku resolves `@vocab/vite` from its own install and aliases bare `@vocab/vite…` imports (including those injected into app and `compilePackages` `.vocab` files) onto that copy — consumers do **not** need a direct `@vocab/vite` dependency for resolve.

Sku registers a language chunk **only** when `onRequest` returns `language` (server Document preload only).
If `language` is omitted, no language chunk is preloaded, which can delay loading text.

```tsx
// src/server.tsx
import type { SkuSsrOnRequest } from 'sku';

export const onRequest: SkuSsrOnRequest = ({ request }) => ({
  // Must match a name from sku config `languages` (or `en-PSEUDO`)
  language: resolveLocaleFromRequest(request), // e.g. 'th-TH'
});
```

Wrap your UI in `VocabProvider` via `AppWrapper` (see [App Wrapper / Providers](./providers.md)) or a layout.
Client locale is app-owned: re-derive it the same way `onRequest` did (URL / cookies / headers), via React Router hooks inside `AppWrapper`, or optionally seed it through `clientContext`.
URL path segments like `/en/hello` are fine for routing — identify vocab language in the server entry from that URL (or cookies/headers), not by relying on sku to read `:language`.

For general Vocab setup (`languages` config, `.vocab` folders, translation workflow), see [Multiple languages](../multi-language.md).

## Multiple paths per page / languages in path

Some URL schemes serve the same page at more than one path — for example `/about` for a default language and `/fr/about` when the language is nested in the path.

React Router Data Mode matches on the full path and does not let one route definition declare multiple paths.
Define the page once, then register a separate route object for each path that should serve it:

```tsx
// src/pages/page/route.ts
import type { RouteObject } from 'react-router';

const route = {
  lazy: () => import('./page.js'),
} satisfies Omit<RouteObject, 'path'>;

export const aboutRoutes: RouteObject[] = [
  { ...route, path: 'page' },
  { ...route, path: 'fr/page' },
];
```

Be careful using dynamic params such as `:lang`.
A dynamic segment would match unsupported prefixes and the server would respond on routes you do not intend to support; listing only supported prefixes means unknown ones fall through as not found.
