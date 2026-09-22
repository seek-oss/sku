# Create Project

## ADDED Requirements

### Requirement: No reliance on install hooks

Create MUST NOT rely on a sku lifecycle hook at install time to configure the
new project. The `sku format` run after install is the sole configurator of
newly created projects.

#### Scenario: New project is configured after create

- **WHEN** `sku create` completes successfully, including the `sku format`
  run after install
- **THEN** the new project contains sku's generated configuration files
  (including `tsconfig.json`, `eslint.config.mjs`, and `.prettierrc`)

#### Scenario: Format failure leaves configuration to the first command

- **WHEN** the `sku format` run after install fails or cannot execute
- **THEN** create still reports the project as created
- **AND** the project's generated configuration files are written on the next
  sku command that runs configure
