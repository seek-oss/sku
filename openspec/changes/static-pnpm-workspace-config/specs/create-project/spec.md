## ADDED Requirements

### Requirement: Created pnpm projects get static workspace settings

When creating a pnpm project, create SHALL write the project's `pnpm-workspace.yaml` by running the same sync that `sku format` uses. Create permits file creation, because scaffolding a new project is an explicit opt-in. Create writes the file before dependency installation.

Create MUST NOT maintain its own workspace-file writer. Create and `sku format` share one writer, so they produce the same output by construction.

Writing the file before install ensures sku's settings apply to the first install. It also marks the project as its own workspace root.

#### Scenario: New project file matches sync output

- **WHEN** a user creates a new pnpm project
- **AND** `sku lint` subsequently runs in that project
- **THEN** the pnpm workspace check passes, finding `pnpm-workspace.yaml` already aligned

### Requirement: Create does not install a pnpm config dependency

Create MUST NOT install `pnpm-plugin-sku` (or any pnpm config dependency) into new projects.

Create MUST NOT gate any install step on the project's pnpm version.

#### Scenario: No config dependency in a new project

- **WHEN** a user creates a new pnpm project
- **THEN** the generated `pnpm-workspace.yaml` contains no `configDependencies` entry
- **AND** the install step runs identically regardless of the installed pnpm version
