## 1. Create install override

- [x] 1.1 Read `SKU_CREATE_SKU_SPECIFIER` in install path; when set, use it as the sku dependency specifier as-is
- [x] 1.2 Keep unversioned `sku` when the env var is unset
- [x] 1.3 Add a brief code comment that the env var is internal/test-only

## 2. Strict mode for soft failures

- [x] 2.1 Read `SKU_CREATE_STRICT` in format path; when unset, keep warn-and-continue (including spawn errors)
- [x] 2.2 When `SKU_CREATE_STRICT` is set, reject on format non-zero exit or spawn error so create fails
- [x] 2.3 Add a brief code comment that the env var is internal/test-only
- [x] 2.4 Ensure `createProject` does not print success when format rejects under strict

## 3. sku-create test harness

- [x] 3.1 Pack local `packages/sku` once per suite into `fs.mkdtemp` under `os.tmpdir()` and pass `SKU_CREATE_SKU_SPECIFIER=sku@file:<abs-path>`
- [x] 3.2 Pass `SKU_CREATE_STRICT=1` (or equivalent) for create integration runs
- [x] 3.3 Thread env through `@sku-private/testing-library` create helper if needed
- [x] 3.4 Remove `linkWorkspacePackages` / `packages: ['../../packages/*']` harness used only for local sku
- [x] 3.5 Assert create fails under strict when format would fail (or equivalent coverage)
- [x] 3.6 Update snapshots if package.json / outputs change under tarball install

## 4. Release

- [x] 4.1 Skip changeset unless a publishable surface change requires one (default: no user-visible change)
