## 1. Author the client input

- [x] 1.1 Set client Rolldown `input` to `{ 'ssr-client': #entries/ssr-client }` using a shared chunk-name constant

## 2. Identify bootstrap chunk

- [x] 2.1 Change `findEntryChunk` to resolve `'ssr-client'` via `findManifestChunk` (key or `chunk.name`)
- [x] 2.2 Do not identify the bootstrap by `isEntry` or by excluding other chunk names

## 3. Tests

- [x] 3.1 Unit-test that a manifest with additional `isEntry` chunks still returns the `ssr-client` chunk
- [x] 3.2 Unit-test that a missing `ssr-client` chunk throws
- [x] 3.3 Unit-test that a manifest key of `ssr-client` is found without `isEntry`
