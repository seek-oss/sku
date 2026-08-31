## ADDED Requirements

### Requirement: Missing .localhost hosts do not trigger hosts-file warnings

When checking the system hosts file during local development commands, the system SHALL NOT warn about missing entries for exact `localhost` or for hostnames that end with `.localhost`.

#### Scenario: Missing .localhost host is silent

- **GIVEN** the app is configured with host `au.seek.com.localhost`
- **AND** that name is not present in the system hosts file
- **WHEN** sku runs a hosts check (for example on `start`)
- **THEN** it does not warn that the host is missing from the hosts file

#### Scenario: Missing non-localhost host still warns

- **GIVEN** the app is configured with host `custom.example`
- **AND** that name is not present in the system hosts file
- **WHEN** sku runs a hosts check
- **THEN** it warns that the host is missing
- **AND** it suggests running `setup-hosts` with elevated privileges

### Requirement: setup-hosts still writes .localhost entries

`sku setup-hosts` SHALL still add configured hostnames that end with `.localhost` to the system hosts file. Exact `localhost` SHALL continue to be skipped.

#### Scenario: .localhost host is written

- **GIVEN** the app is configured with host `au.seek.com.localhost`
- **WHEN** `sku setup-hosts` runs with sufficient privileges
- **THEN** `au.seek.com.localhost` is added to the system hosts file pointing at the local machine

#### Scenario: Exact localhost is not written

- **GIVEN** the app is configured with host `localhost`
- **WHEN** `sku setup-hosts` runs
- **THEN** it does not attempt to add `localhost` to the system hosts file

### Requirement: Local HTTPS remains available

The system SHALL continue to support `httpsDevServer` (and existing local HTTPS certificate behaviour) so teams that need a secure context under HTTPS — including Safari — can keep using local SSL.

#### Scenario: httpsDevServer still enables HTTPS

- **GIVEN** `httpsDevServer` is `true`
- **WHEN** the local development server starts
- **THEN** the server is served over HTTPS with the existing certificate behaviour

### Requirement: In-repo examples prefer .localhost hostnames

sku’s documentation examples, fixtures, and first-party tests that demonstrate multi-host or custom local hostnames SHALL use `*.localhost` rather than `dev.*` or `*.local` patterns.

#### Scenario: Docs and fixtures show .localhost

- **GIVEN** a sku docs example or fixture that configures a custom local hostname
- **WHEN** a reader inspects the example
- **THEN** the hostname ends with `.localhost`
- **AND** it does not use a `dev.` prefix or `.local` suffix as the demonstrated pattern
