## Why

`@sku-lib/create` integration tests install unversioned `sku` from the registry, then run `sku format`. That couples create tests to the latest _published_ sku, so WIP create↔configure fixes fail or lie until release. The existing `linkWorkspacePackages` fixture workaround is fragile and breaks when create writes a nested `pnpm-workspace.yaml`.

## What Changes

- Add an internal test-only env override (`SKU_CREATE_SKU_SPECIFIER`) so create installs `sku` using a caller-supplied dependency specifier (typically `sku@file:<absolute-path-to-.tgz>`) instead of the registry
- Fix soft-mode format messaging: stop treating exit code `1` as “warnings”. After sku’s lint/format exit-code consolidation, failures consistently exit `1`, so create was mis-labelling real errors as warnings. Soft continue remains the production default
- Update `sku-create` tests to `pnpm pack` local sku into a unique `os.tmpdir()` dir, pass the specifier override, and drop the workspace-linking harness for sku resolution
- After create succeeds, assert the new project’s `lint` which pass (quality gate lives in the harness, not a create-time hard fail)
- Snapshot coverage of generated files remains; start/build smoke stays out of scope

## Non-goals

- Public CLI flag for choosing a sku version
- Hard-failing create on format failure (including any `SKU_CREATE_STRICT` / opt-in strict mode)
- Changing production soft format behaviour (warn and continue); only the incorrect “warnings” vs “failed” messaging is corrected
- Overriding other deps (`braid`, `react`, `pnpm-plugin-sku`)
- Generate-only / skip-install mode for cheaper runs
- Full start/build smoke tests

## Capabilities

### New Capabilities

- `create-project`: How create installs dependencies and runs format, including the test-only sku specifier override and default soft format behaviour; create integration tests validate the new project via lint after create

### Modified Capabilities

- (none)

## Impact

- **Code**: `packages/create` (`install.ts`, `format.ts`, possibly `createProject.ts`); `tests/node/sku-create.test.ts`; `@sku-private/testing-library` create helpers
- **Public API**: No user-facing API change. Specifier override is internal/test-only (undocumented for consumers). No `SKU_CREATE_STRICT`
- **Breaking**: None when env unset (format still soft). Soft-path console wording for exit `1` changes from “warnings” to failure-style messaging
- **Release**: Prefer no changeset unless packaging requires one; no intentional user-visible behaviour change
- **Docs**: None required for users; brief comment near the specifier env read is enough
