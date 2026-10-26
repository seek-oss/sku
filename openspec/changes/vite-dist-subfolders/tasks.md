## 1. Config

- [ ] 1.1 Add `distSubfolders` to the config schema, defaults, `SkuConfig` types and `skuContext`, with a resolved `distSubfolders` value (`false` for SSR)
- [ ] 1.2 Reject the option with `buildType: 'ssr'` in `validateConfig`
- [ ] 1.3 Reject `client`, `rendered` and `server` in `environments` unconditionally
- [ ] 1.4 Add `validateConfig` unit tests for 1.2 and 1.3

## 2. Vite output

- [ ] 2.1 Make `createOutDir` layout-aware and replace `client` / `ssrClient` / `ssr` with `distClient` and `distServer`; add `distRendered`
- [ ] 2.2 Point the static client build and SSR client build at `outDir.distClient`, and the SSR server build at `outDir.distServer`
- [ ] 2.3 Write prerendered HTML and metadata under `outDir.distRendered`; read the manifest from `outDir.distClient`
- [ ] 2.4 Fail the static build before `createBuilder` when `public/` contains `.html` files and the option is on
- [ ] 2.5 Clean the target before a static subfolder build; remove `.vite` from `client/` and `render/` afterwards
- [ ] 2.6 Copy `public/` into `outDir.distClient`

## 3. Webpack output

- [ ] 3.1 Resolve webpack asset output to `distClient` and HTML/metadata output to `distRendered` when the option is on, sharing the directory helper with Vite
- [ ] 3.2 Copy `public/` into `distClient` and fail the build before bundling when `public/` contains `.html` files and the option is on

## 4. `sku serve`

- [ ] 4.1 Add `rendered/` prefix to route rewrites, metadata globbing and header sources for the subfolder layout
- [ ] 4.2 Serve existing files under `publicPath` from `client/` with a `client/`-rooted handler (a rewrite can't map to nested paths); everything else falls through to the route rewrites

## 5. Tests

- [ ] 5.1 Add a static Vite test with the option on, covering environments and no environments, asserting `rendered/` and `client/` contents, no HTML in `client/`, and no leftover intermediates
- [ ] 5.2 Add a static webpack test with the option on asserting `rendered/` and `client/` contents
- [ ] 5.3 Assert `sku serve` works for the subfolder layout (route, asset, `publicPath` set) for both bundlers, and still works for the legacy layout
- [ ] 5.4 Assert a build with HTML in `public/` fails with the option on, for both bundlers

## 6. Docs and release

- [ ] 6.1 Document `distSubfolders` in `site/docs/configuration.md`
- [ ] 6.2 Add a sku minor changeset noting the new `distSubfolders` option
