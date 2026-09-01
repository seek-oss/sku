## Why

Create integration tests pack local `sku` into a tarball and install it via `SKU_CREATE_SKU_SPECIFIER`. `pnpm pack` rewrites `workspace:` dependencies to local semver, so on a changesets release branch those versions are not on the registry yet and the suite fails with `ERR_PNPM_NO_MATCHING_VERSION`. Tests still need this commit’s sku without that registry coupling.

## What Changes

- sku-create tests pin local sku with `sku@link:<absolute-path-to-packages/sku>` instead of packing a tarball
- Drop pack-only snapshot scrubbing (`sku@file:` in generated `pnpm-workspace.yaml`)
- No separate pack/`files` test: asserting a tarball contains `package.json` `files` only retests pnpm pack
- No change to create’s production install path or to `SKU_CREATE_SKU_SPECIFIER` itself (still a full specifier, used as-is)

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `create-project`: How create tests pin local sku (link specifier instead of packed tarball), and that packing is not used for create

## Impact

- **Code**: `tests/node/sku-create.test.ts` and its snapshots. `packages/create` install path unchanged.
- **Public API**: None. `SKU_CREATE_SKU_SPECIFIER` remains internal/test-only.
- **Breaking**: None for consumers.
- **Release**: No changeset (test-only).
- **Docs**: None for users; comments in the test harness are enough.
