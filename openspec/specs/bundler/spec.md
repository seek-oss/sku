# Bundler

## Purpose

How the `bundler` config option selects Webpack vs Vite for supported commands.

## Requirements

### Requirement: Start and build follow bundler setting

When `bundler` is `webpack` (default) or `vite`, `sku start` and `sku build`
SHALL run using that bundler.

#### Scenario: Vite start

- **GIVEN** sku config sets `bundler: 'vite'`
- **WHEN** the user runs `sku start`
- **THEN** the Vite development server is used

### Requirement: Vite rejects SSR commands

When `bundler` is `vite`, `sku start-ssr` and `sku build-ssr` SHALL fail with
an error stating that SSR is only supported with Webpack.

#### Scenario: Vite start-ssr

- **GIVEN** sku config sets `bundler: 'vite'`
- **WHEN** the user runs `sku start-ssr`
- **THEN** the command fails
- **AND** the error states that SSR is only supported with Webpack
