# Spec Delta

## ADDED Requirements

### Requirement: Server entry may flush on shutdown

The server entry MAY include `onShutdown`, a function with no arguments.
The function MAY return a promise.
Omitting `onShutdown` MUST NOT be an error.

#### Scenario: Omitting onShutdown is not an error

- **WHEN** the server entry omits `onShutdown`
- **THEN** the server listens

#### Scenario: onShutdown takes no arguments

- **WHEN** the server entry defines `onShutdown`
- **THEN** sku calls that function with no arguments

### Requirement: Server entry may set the shutdown deadline

The server entry MAY include `shutdownTimeoutMs`, the number of milliseconds shutdown may take before the production server exits 1.
Startup MUST fail, in `sku start` and production, when `shutdownTimeoutMs` is set to anything other than a positive integer.

#### Scenario: Omitting shutdownTimeoutMs is not an error

- **WHEN** the server entry omits `shutdownTimeoutMs`
- **THEN** the server listens

#### Scenario: An invalid value fails startup in development

- **WHEN** the server entry sets `shutdownTimeoutMs` to 0
- **AND** the app runs under `sku start`
- **THEN** startup fails
