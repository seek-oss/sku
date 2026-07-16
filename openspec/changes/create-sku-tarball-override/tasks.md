## 1. Create install override

- [ ] 1.1 Read `SKU_CREATE_SKU_SPECIFIER` in install path; when set, use it as the sku dependency specifier as-is
- [ ] 1.2 Keep unversioned `sku` when the env var is unset
- [ ] 1.3 Add a brief code comment that the env var is internal/test-only

## 2. Strict mode for soft failures

- [ ] 2.1 Read `SKU_CREATE_STRICT` in format path; when unset, keep warn-and-continue (including spawn errors)
- [ ] 2.2 When `SKU_CREATE_STRICT` is set, reject on format non-zero exit or spawn error so create fails
- [ ] 2.3 Add a brief code comment that the env var is internal/test-only
- [ ] 2.4 Ensure `createProject` does not print success when format rejects under strict

## 3. sku-create test harness

- [ ] 3.1 Pack local `packages/sku` once per suite into `fs.mkdtemp` under `os.tmpdir()` and pass `SKU_CREATE_SKU_SPECIFIER=sku@file:<abs-path>`
- [ ] 3.2 Pass `SKU_CREATE_STRICT=1` (or equivalent) for create integration runs
- [ ] 3.3 Thread env through `@sku-private/testing-library` create helper if needed
- [ ] 3.4 Remove `linkWorkspacePackages` / `packages: ['../../packages/*']` harness used only for local sku
- [ ] 3.5 Assert create fails under strict when format would fail (or equivalent coverage)
- [ ] 3.6 Update snapshots if package.json / outputs change under tarball install

## 4. Release

- [ ] 4.1 Skip changeset unless a publishable surface change requires one (default: no user-visible change)
