## 1. Config

- [x] 1.1 Add `distSubfolders` to the config schema, defaults, `SkuConfig` types and `skuContext`, with a resolved `distSubfolders` value (`false` for SSR)
- [x] 1.2 Reject the option with `buildType: 'ssr'` in `validateConfig`
- [x] 1.3 Reject `client`, `rendered` and `server` in `environments` unconditionally
- [x] 1.4 Add `validateConfig` unit tests for 1.2 and 1.3

## 2. Vite output

- [x] 2.1 Make `createOutDir` layout-aware and replace `client` / `ssrClient` / `ssr` with `distClient` and `distServer`; add `distRendered`
- [x] 2.2 Point the static client build and SSR client build at `outDir.distClient`, and the SSR server build at `outDir.distServer`
- [x] 2.3 Write prerendered HTML and metadata under `outDir.distRendered`; read the manifest from `outDir.distClient`
- [x] 2.4 Fail the static build before `createBuilder` when `public/` contains `.html` files and the option is on
- [x] 2.5 Clean the target before a static subfolder build; remove `.vite` from `client/` and `render/` afterwards
- [x] 2.6 Copy `public/` into `outDir.distClient`

## 3. Webpack output

- [x] 3.1 Resolve webpack asset output to `distClient` and HTML/metadata output to `distRendered` when the option is on, sharing the directory helper with Vite
- [x] 3.2 Copy `public/` into `distClient` and fail the build before bundling when `public/` contains `.html` files and the option is on
- [x] 3.3 For `sku build-ssr` with the option on, set the webpack SSR client output to `distClient` and server output to `distServer`, and have `LoadablePlugin` write its stats to `distServer`
- [x] 3.4 Copy `public/` into `distClient` in `sku build-ssr`

## 4. `sku serve`

- [x] 4.1 Add `rendered/` prefix to route rewrites, metadata globbing and header sources for the subfolder layout
- [x] 4.2 Serve existing files under `publicPath` from `client/` with a `client/`-rooted handler (a rewrite can't map to nested paths); everything else falls through to the route rewrites

## 5. Tests

- [x] 5.1 Add a static Vite test with the option on, covering environments and no environments, asserting `rendered/` and `client/` contents, no HTML in `client/`, and no leftover intermediates
- [x] 5.2 Add a static webpack test with the option on asserting `rendered/` and `client/` contents
- [x] 5.3 Assert `sku serve` works for the subfolder layout (route, asset, `publicPath` set) for both bundlers, and still works for the legacy layout
- [x] 5.4 Assert a build with HTML in `public/` fails with the option on, for both bundlers
- [x] 5.5 Add a webpack SSR build test with the option on asserting `client/` and `server/` contents, and that the server bundle in `server/` serves a page

## 6. Docs and release

- [x] 6.1 Document `distSubfolders` in `site/docs/configuration.md`
- [x] 6.2 Document the `dist/server/server.js` entry with the option on in `site/docs/ssr/webpack-ssr.md`
- [x] 6.3 Add a sku minor changeset noting the new `distSubfolders` option
