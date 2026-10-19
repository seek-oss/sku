## 1. Config

- [ ] 1.1 Add `__UNSAFE_EXPERIMENTAL__distSubfolders` to the config schema, defaults, `SkuConfig` types (experimental JSDoc) and `skuContext`, with a resolved "uses subfolders" value (Vite SSR, or Vite static with the option on)
- [ ] 1.2 Reject the option with `bundler: 'webpack'` and with `buildType: 'ssr'` in `validateConfig`
- [ ] 1.3 Reject `resources` in `environments` when the option is on
- [ ] 1.4 Add `validateConfig` unit tests for 1.2 and 1.3

## 2. Vite output

- [ ] 2.1 Make `createOutDir` layout-aware and replace `client` / `ssrClient` with `resources`; add `documents`
- [ ] 2.2 Point the static client build and SSR client build at `outDir.resources`
- [ ] 2.3 Write prerendered HTML and metadata under `outDir.documents`; read the manifest from `outDir.resources`
- [ ] 2.4 Fail the static build before `createBuilder` when `public/` contains `.html` files and the option is on
- [ ] 2.5 Clean the target before a static subfolder build; remove `.vite` from `resources/` and `render/` afterwards
- [ ] 2.6 Copy `public/` into `outDir.resources`
- [ ] 2.7 Have `startProductionSsrServer` mount sibling `resources/`

## 3. `sku serve`

- [ ] 3.1 Add `documents/` prefix to route rewrites, metadata globbing and header sources for the subfolder layout
- [ ] 3.2 Add the `publicPath/**` to `resources/**` rewrite after route rewrites

## 4. Tests

- [ ] 4.1 Add a static Vite test with the option on, covering environments and no environments, asserting `documents/` and `resources/` contents, no HTML in `resources/`, and no leftover intermediates
- [ ] 4.2 Assert `sku serve` works for the subfolder layout (route, asset, `publicPath` set) and still works for webpack
- [ ] 4.3 Assert a build with HTML in `public/` fails with the option on
- [ ] 4.4 Update SSR browser and node tests that read `dist/client`

## 5. Docs and release

- [ ] 5.1 Document the option in `site/docs/configuration.md` as experimental
- [ ] 5.2 Update SSR docs (`deploy-to-production`, migrating, core topics) from `client/` to `resources/`
- [ ] 5.3 Add a sku minor changeset noting the new experimental option and the experimental-SSR `dist/client` to `dist/resources` rename
