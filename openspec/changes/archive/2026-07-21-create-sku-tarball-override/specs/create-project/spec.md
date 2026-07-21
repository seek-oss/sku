## ADDED Requirements

### Requirement: Default sku install from registry

When creating a project without a test override, create SHALL install the `sku` dependency using an unversioned specifier so the package manager resolves it from the registry as it does for end users.

#### Scenario: No override set

- **WHEN** a user runs create and `SKU_CREATE_SKU_SPECIFIER` is unset
- **THEN** create installs `sku` without a `file:` tarball specifier

### Requirement: Test-only sku specifier override

Create SHALL support an internal environment variable `SKU_CREATE_SKU_SPECIFIER` whose value is a full dependency specifier for `sku`. When set, create MUST install sku using that specifier as-is (no copy or path normalisation in create). When unset, create MUST install unversioned `sku`.

#### Scenario: Override installs packed local sku

- **WHEN** `SKU_CREATE_SKU_SPECIFIER` is set to a valid `sku@file:<absolute-path-to-.tgz>` for a packed local sku
- **THEN** the new project’s installed `sku` dependency resolves from that specifier
- **AND** installation MUST NOT rely on parent workspace `linkWorkspacePackages` or `workspace:*` to resolve sku

#### Scenario: Nested project workspace does not block override

- **WHEN** create writes a `pnpm-workspace.yaml` inside the new project
- **AND** `SKU_CREATE_SKU_SPECIFIER` is set to an absolute `sku@file:…` tarball specifier
- **THEN** sku still installs from that file specifier

### Requirement: Format is soft by default

After installing dependencies, create SHALL run `sku format` on the new project. A non-zero format exit or inability to run format MUST NOT fail create: create MUST warn with failure-style messaging (MUST NOT describe exit code `1` as “warnings”) and MUST still be allowed to report the project as created.

#### Scenario: Format failure does not fail create

- **WHEN** `sku format` fails during create
- **THEN** create does not fail solely because of that format failure
- **AND** create warns with failure-style messaging (not “completed with warnings”)
- **AND** create may still report the project as created

### Requirement: Create integration tests validate via lint

After a successful create in integration tests that use the sku specifier override, the harness MUST run the new project’s lint step. It MUST pass.

#### Scenario: Post-create lint passes

- **WHEN** create finishes successfully for a project under the sku-create integration suite
- **AND** the suite uses `SKU_CREATE_SKU_SPECIFIER` to install packed local sku
- **THEN** running the new project’s lint step succeeds
