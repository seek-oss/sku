## 1. Create tests use linked local sku

- [x] 1.1 In `tests/node/sku-create.test.ts`, set `SKU_CREATE_SKU_SPECIFIER` to `sku@link:<absolute-path-to-packages/sku>`
- [x] 1.2 Remove packing (`pnpm pack`, temp dest, tarball path, `afterAll` cleanup of the pack dir)
- [x] 1.3 Remove `sku@file:` YAML scrubbing; update `pnpm-workspace.yaml` snapshots so they do not contain a tarball `onlyBuiltDependencies` key

## 2. Verify

- [x] 2.1 Run the sku-create suite; it MUST pass without resolving unpublished workspace versions from the registry
