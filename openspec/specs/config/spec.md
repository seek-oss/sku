# Config

## Purpose

How sku finds and accepts a project config file.

## Requirements

### Requirement: Default config discovery

The system SHALL resolve an omitted config path by checking, in order,
`sku.config.ts`, `sku.config.js`, then `sku.config.mjs` in the project root.

#### Scenario: TypeScript config present

- **GIVEN** `sku.config.ts` exists in the project root
- **WHEN** a sku command runs without `--config` or `SKU_CONFIG`
- **THEN** that file is used as the project config

#### Scenario: No config file

- **GIVEN** no `sku.config.ts`, `sku.config.js`, or `sku.config.mjs` in the project root
- **WHEN** a sku command runs without `--config` or `SKU_CONFIG`
- **THEN** the command proceeds with built-in defaults

### Requirement: Missing custom config path

When `--config` or `SKU_CONFIG` names a path that does not exist, the system
SHALL print an error that includes that path and exit with code 1.

#### Scenario: Explicit path missing

- **GIVEN** `--config ./missing.config.ts` is passed
- **AND** that file does not exist
- **WHEN** a sku command runs
- **THEN** the process exits with code 1
- **AND** the error message includes the resolved path
