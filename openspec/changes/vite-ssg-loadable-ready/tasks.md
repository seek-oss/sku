## 1. Collector chunk tags

- [x] 1.1 Add `data-chunk` on Collector-registered, non-entry `<script type="module">` tags only (not recursive imports, not the client entry)

## 2. Sku Vite client

- [x] 2.1 In sku’s Vite client entry, wait by `import()`ing tagged chunk script URLs, then read client context and call `client()`. Keep the helper private to sku; do not export it from `@sku-lib/vite`

## 3. Tests and release

- [x] 3.1 Assert translations (and other Vite SSG) production browser tests hydrate without translation/loadable hydration mismatches; update snapshots for `data-chunk`
- [x] 3.2 Add patch changesets for `@sku-lib/vite` and `sku`. Do not add public-API docs or a minor bump
