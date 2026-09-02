## ADDED Requirements

### Requirement: Created pnpm projects get static workspace settings

When creating a pnpm project, create SHALL write the project's `pnpm-workspace.yaml` by running the same sync used at configure time, before dependency installation.
Create MUST NOT maintain its own workspace-file writer; create and configure share one writer, so identical output is guaranteed by construction.
Writing the file before install ensures sku's settings apply to the first install and marks the project as its own workspace root.

#### Scenario: New project file matches sync output

- **WHEN** a user creates a new pnpm project
- **AND** any sku command subsequently runs in that project
- **THEN** the sync finds `pnpm-workspace.yaml` already aligned and produces no diff

### Requirement: Create does not install a pnpm config dependency

Create MUST NOT install `pnpm-plugin-sku` (or any pnpm config dependency) into new projects.
Create MUST NOT gate any install step on the project's pnpm version.

#### Scenario: No config dependency in a new project

- **WHEN** a user creates a new pnpm project
- **THEN** the generated `pnpm-workspace.yaml` contains no `configDependencies` entry
- **AND** the install step runs identically regardless of the installed pnpm version
