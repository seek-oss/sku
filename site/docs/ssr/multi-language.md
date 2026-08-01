# Multi-language / Localisation

When `languages` is configured, SSR registers the active language chunk (for example `en-translations`) on the initial document so text is available without a delayed download.

Export `getLanguage` from the server entry so it returns a name from config `languages` (or `en-PSEUDO`):

```tsx
// src/server.tsx
import { defineServerEntry } from 'sku/ssr';

const server = defineServerEntry({
  getLanguage({ req }) {
    return resolveLocaleFromPath(req.path); // e.g. 'th-TH'
  },
});
export default server;
```

If `getLanguage` is omitted, no language chunk is preloaded and text may load later.

Wrap your UI in `VocabProvider` in the [root layout](./providers.md#root-layout-for-providers).
Locale must track client navigation, so re-derive it the same way in the layout (URL / cookies) with React Router hooks — or seed it through `clientContext`.

For Vocab setup (`languages` config, `.vocab` folders, translation workflow), see [Multiple languages](../multi-language.md).

## Multiple paths per page / languages in path

Some URL schemes serve the same page at more than one path — for example `/about` for a default language and `/fr/about` when the language is nested in the path.

React Router matches on the full path and does not let one route declare multiple paths.
Define the page once, then register a separate route object for each path:

```tsx
// src/pages/page/route.ts
import type { RouteObject } from 'react-router';

const route = {
  lazy: () => import('./page'),
} satisfies Omit<RouteObject, 'path'>;

export const aboutRoutes: RouteObject[] = [
  { ...route, path: 'page' },
  { ...route, path: 'fr/page' },
];
```

Prefer listing supported prefixes over a dynamic `:lang` segment — a dynamic segment would also match unsupported prefixes.
