# Serve

## Purpose

Guards for `sku serve` before serving a production build locally.

## Requirements

### Requirement: Build output required

When the configured target directory does not exist, `sku serve` SHALL tell
the user to run `sku build` first and exit with code 1.

#### Scenario: No build output

- **GIVEN** the target directory is missing
- **WHEN** the user runs `sku serve`
- **THEN** the process exits with code 1
- **AND** the message says `sku build` must be run first

### Requirement: Unknown site rejected

When `--site` names a site not listed in config, `sku serve` SHALL report an
unknown site and exit with code 1.

#### Scenario: Typo site name

- **GIVEN** config defines sites `seek` and `jobstreet`
- **WHEN** the user runs `sku serve --site seak`
- **THEN** the process exits with code 1
- **AND** the error names the unknown site

### Requirement: Remote publicPath unsupported

When `publicPath` is an absolute `http` URL or protocol-relative `//` URL,
`sku serve` SHALL report that serve is not supported and exit with code 1.

#### Scenario: CDN publicPath

- **GIVEN** config sets `publicPath` to `https://cdn.example.com/assets/`
- **WHEN** the user runs `sku serve`
- **THEN** the process exits with code 1
- **AND** the error states serve is not supported for a separate-domain publicPath
