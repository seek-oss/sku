## 1. Collector chunk tags

- [x] 1.1 Add `data-required-chunk` on Collector-registered, non-entry `<script type="module">` tags only (not recursive imports, not the client entry)

## 2. Sku Vite client

- [x] 2.1 In sku’s Vite client entry, wait by `import()`ing tagged chunk script URLs, then read client context and call `client()`. Keep the helper private to sku; do not export it from `@sku-lib/vite`

## 3. Tests and release

- [x] 3.1 Assert translations (and other Vite SSG) production browser tests hydrate without translation/loadable hydration mismatches; update snapshots for `data-required-chunk`
- [x] 3.2 Add patch changesets for `@sku-lib/vite` and `sku`. Do not add public-API docs or a minor bump

## 4. Standalone registered chunks

- [x] 4.1 Tag `register()` roots with `data-required-chunk` unless the script is the Collector client-entry file (including Vite-entry standalone chunks). Do not use Vite `isEntry` as the exclusion. Do not tag recursive imports
- [x] 4.2 Remove injectable-script sorting (`sortInjectableScript` and the `isClientEntry` field that only fed it). Emit body `<script type="module">` tags in insertion order. Add `async` on `data-required-chunk` scripts. Do not add `async` on the sku client entry. Keep using the client-entry file only to exclude `data-required-chunk`. Drop tests that assert client-entry-last order.
- [x] 4.3 Re-assert translations (and other Vite SSG) production browser tests and snapshots so standalone language preloads still have `async` and `data-required-chunk` and hydrate without translation mismatches (script tag order may change)
