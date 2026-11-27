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
