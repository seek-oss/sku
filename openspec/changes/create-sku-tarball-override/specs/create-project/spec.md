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

After installing dependencies, create SHALL run `sku format` on the new project. When `SKU_CREATE_STRICT` is unset, a non-zero format exit or inability to run format MUST NOT fail create: create MUST warn with failure-style messaging (MUST NOT describe exit code `1` as “warnings”) and MUST still be allowed to report the project as created.

#### Scenario: Format failure does not fail create by default

- **WHEN** `sku format` fails during create
- **AND** `SKU_CREATE_STRICT` is unset
- **THEN** create does not fail solely because of that format failure
- **AND** create warns with failure-style messaging (not “completed with warnings”)
- **AND** create may still report the project as created

### Requirement: Strict mode fails create on soft failures

Create SHALL support an internal environment variable `SKU_CREATE_STRICT`. When set to a truthy value, soft failures in the create process (today: format non-zero exit or inability to run format) MUST fail create (non-zero exit / thrown error) and MUST NOT report the project as successfully created.

#### Scenario: Strict format failure fails create

- **WHEN** `SKU_CREATE_STRICT` is set
- **AND** `sku format` fails during create (for example configure or lint/format error)
- **THEN** create fails
- **AND** create does not print a successful “created” completion for that run

#### Scenario: Strict successful format allows completion

- **WHEN** `SKU_CREATE_STRICT` is set
- **AND** `sku format` completes successfully during create
- **THEN** create may complete and report the project as created
