## 1. Config

- [x] 1.1 Add `entrySideEffects?: string[]` to `ViteSkuConfig` (default `[]`) and the config schema
- [x] 1.2 Thread it through `defaultSkuConfig` and `skuContext`

## 2. Vite injection

- [x] 2.1 Add `virtual:sku/entry-side-effects` that emits cwd-resolved imports in array order (empty list is a no-op module)
- [x] 2.2 Never-bundle that virtual id in tsdown and declare the module
- [x] 2.3 Import it first in `vite-client.tsx`, `vite-render.tsx`, `ssr-client.tsx`, and `ssr-server.tsx` (before polyfills on client entries)
- [x] 2.4 Prepend the virtual id to static and SSR `collectStyle` entry lists
- [x] 2.5 Confirm published sku entries keep the side-effect import first

## 3. Template

- [x] 3.1 Set `entrySideEffects: ['braid-design-system/reset']` on the SSR create template sku config

## 4. Tests

- [x] 4.1 Unit-test virtual-module output, cwd resolve, missing-specifier failure, and empty no-op
- [x] 4.2 Cover SSR start via the braid-design-system SSR fixture (reset only in config, consumer graph imports Braid)
- [x] 4.3 Rely on collectStyle prepend plus unit tests for start CSS collection order (no dedicated fixture)

## 5. Docs and release

- [x] 5.1 Document `entrySideEffects` in `configuration.md` and contrast it with `polyfills` in extra-features
- [x] 5.2 Rewrite SSR provider and migrating Braid reset docs to the config option
- [x] 5.3 Add a minor changeset
