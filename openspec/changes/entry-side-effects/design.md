## Context

See proposal.md for why.
`polyfills` already prepends modules via `virtual:sku/polyfills` on Vite **client** entries only.
Managed Data Mode evaluates `__sku_alias__routesEntry` before `__sku_alias__serverEntry`.
A reset import in `RootLayout` or `server.tsx` is therefore not first.
Start CSS collection (`collectStyle`) walks a separate entry list and can emit component CSS before reset CSS even when the JS throw is avoided.

## Goals / Non-Goals

**Goals:**

- One config list that is first on Vite static and Vite SSR, browser and Node.
- Same resolve-from-app behaviour as `polyfills`.
- Start collected CSS visits those modules first.

**Non-Goals:**

- Changing the static production SSG Rolldown input (shipped CSS comes from the client build).
- Auto-detecting Braid.
- A public plugin hook.

## Decisions

### Separate virtual module, not `polyfills`

Add `virtual:sku/entry-side-effects`.
Generate `import '…';` lines from config, resolved with `require.resolve` from cwd, same as `resolvePolyfills`.
Keep `polyfills` browser-only so `window` polyfills never load on the Node server.

Alternative: overload `polyfills`. Rejected because extra-features docs promise browser-only, and reset must run on the SSR server graph.

### First import on sku-owned Vite wrappers

Import the virtual module as the first statement of:

- `vite-client.tsx` (before `virtual:sku/polyfills`)
- `vite-render.tsx` (static `sku start` Node graph)
- `ssr-client.tsx` (before polyfills)
- `ssr-server.tsx` (before `routesEntry`)

`ssr-client.dev.tsx` stays a preamble then dynamic import of `ssr-client`.
Side effects still run before hydrate work.

Do not transform consumer source.

Alternative: `braidReset: true`. Rejected in favour of a generic list the template fills with Braid reset.

### Prepend the virtual id to `collectStyle` entries

SSR start list becomes virtual module, then today’s `serverEntry` / `routesEntry` / `ssrServerEntry`.
Static start list becomes virtual module, then `renderEntry`.
Visited-set collection then emits reset CSS before CSS reached only through later entries.

### Static production SSG input stays the consumer `renderEntry`

Production static CSS is the client bundle, whose entry is already `vite-client.tsx`.
Wrapping SSG `input` would be a larger behaviour change for a graph that does not ship CSS.

### ViteSkuConfig field

Put `entrySideEffects` on `ViteSkuConfig`.
It is a Vite graph feature, so it belongs with the other Vite config fields.

### Create template opts in

SSR and Vite static `sku.config.ts` set `entrySideEffects: ['braid-design-system/reset']`.
SSR RootLayout may keep a local reset import (harmless ESM singleton).
Docs state that config is the graph guarantee.

The Vite static template overlays `App.tsx` without the reset import.
Webpack keeps the base `App.tsx` first-line reset.

### Published import order

Mark `virtual:sku/entry-side-effects` as `neverBundle` in tsdown, like `virtual:sku/polyfills`.
Confirm published `ssr-server.mjs` / `ssr-client.mjs` / `vite-client.mjs` keep the side-effect import first (rolldown has reordered static imports in these entries before).

## Risks / Trade-offs

- **[Risk]** tsdown reorders the new import below `routesEntry` → SSR start still throws. → Side-effect import plus a published import-order unit test and braid SSR start that fails if reset is late.
- **[Risk]** pnpm cannot resolve Braid from `node_modules/sku`. → Resolve from cwd in the virtual-module plugin, not a literal import inside sku source.
- **[Risk]** Apps put `window` code in `entrySideEffects` → Node SSR throws. → Docs: isomorphic only; use `polyfills` for browser globals.
- **[Trade-off]** Existing SSR apps keep the footgun until they set the option. → Template + migrate/provider docs. No silent auto-inject.

## Migration Plan

New Vite SSR and Vite SSG apps get the option from create.
Existing Vite Braid apps add `entrySideEffects: ['braid-design-system/reset']`.
Rollback is omit the key (empty default).
