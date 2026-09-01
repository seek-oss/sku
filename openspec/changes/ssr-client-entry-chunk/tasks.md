## 1. Identify bootstrap chunk

- [x] 1.1 Change `findEntryChunk` to select the manifest chunk with `isEntry` and `name === 'ssr-client'`
- [x] 1.2 Do not identify the bootstrap by excluding other chunk names

## 2. Tests

- [x] 2.1 Unit-test that a manifest with additional `isEntry` chunks still returns the `ssr-client` chunk
- [x] 2.2 Unit-test that a missing `ssr-client` chunk throws
