## Why

`@sku-lib/create` integration tests install unversioned `sku` from the registry, then run `sku format`. That couples create tests to the latest _published_ sku, so WIP create↔configure fixes fail or lie until release. The existing `linkWorkspacePackages` fixture workaround is fragile and breaks when create writes a nested `pnpm-workspace.yaml`.

## What Changes

- Add an internal test-only env override (`SKU_CREATE_SKU_SPECIFIER`) so create installs `sku` using a caller-supplied dependency specifier (typically `sku@file:<absolute-path-to-.tgz>`) instead of the registry
- Add an internal opt-in (`SKU_CREATE_STRICT`) so soft failures in create (today: format) fail the create run in tests, without changing production’s warn-and-continue default
- Update `sku-create` tests to `pnpm pack` local sku into a unique `os.tmpdir()` dir, pass both overrides, and drop the workspace-linking harness for sku resolution
- Snapshot coverage of generated files remains; start/build smoke stays out of scope

## Non-goals

- Public CLI flag for choosing a sku version
- Changing production format behaviour when strict is unset
- Overriding other deps (`braid`, `react`, `pnpm-plugin-sku`)
- Generate-only / skip-install mode for cheaper runs
- Full start/build smoke tests

## Capabilities

### New Capabilities

- `create-project`: How create installs dependencies and runs format, including the test-only sku specifier override, optional strict mode, and default soft format behaviour

### Modified Capabilities

- (none)

## Impact

- **Code**: `packages/create` (`install.ts`, `format.ts`, possibly `createProject.ts`); `tests/node/sku-create.test.ts`; `@sku-private/testing-library` create helpers
- **Public API**: No user-facing API change. Both env overrides are internal/test-only (undocumented for consumers)
- **Breaking**: None when envs unset (including format still soft)
- **Release**: Prefer no changeset unless packaging requires one; no intentional user-visible behaviour change
- **Docs**: None required for users; brief comments near the env reads are enough
