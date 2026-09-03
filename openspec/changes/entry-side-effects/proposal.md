## Why

Sku owns Vite client and SSR entries, so an app cannot put a module first in the graph by putting it first in `RootLayout` or `App.tsx`.
Braid’s CSS reset must evaluate before any Braid component, and `sku start` throws if it does not.
Import order in `routes.tsx` is not a reliable contract because eslint sorts local imports.

## What Changes

- Add Vite config `entrySideEffects: string[]` (default `[]`).
- Sku evaluates those modules first on Vite static and Vite SSR graphs (client, Node render/SSR, and start CSS collection).
- Specifiers resolve from the app, in array order.
- Both Vite create templates set `entrySideEffects: ['braid-design-system/reset']`.
- The Vite SSG template overlays `App.tsx` without a local reset import.
- Docs teach this option as the way to apply Braid reset (and any other isomorphic entry side effect).
- Docs contrast it with `polyfills` (browser-only).

## Non-goals

- Auto-detecting Braid or a `braidReset` boolean.
- A public sku plugin API.
- Changing `polyfills` behaviour.
- Storybook preview injection.

## Capabilities

### New Capabilities

- `entry-side-effects`: Vite apps can list modules that sku imports before any consumer module on static and SSR graphs.

## Impact

- Public config (`ViteSkuConfig`, schema, `configuration.md`).
- Sku Vite entries, the polyfills-style virtual module, and start CSS collection order.
- Vite SSR and Vite SSG create templates, and Braid reset docs.
- Changesets (sku minor, create patch).
