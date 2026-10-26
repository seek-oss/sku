## Purpose

Lets static apps (Vite or webpack) emit a build output that separates rendered HTML documents from client assets, so each can be deployed on its own from `dist/rendered/<environment>` and `dist/client`. The layout is opt-in via `distSubfolders`, and is intended to become the default in a future breaking change.

## ADDED Requirements

### Requirement: `distSubfolders` option enables the subfolder layout

Sku MUST accept `distSubfolders` as a boolean that defaults to `false`.

The option MUST be available with both the `vite` and `webpack` bundlers.

Config validation MUST fail when the option is set with `buildType: 'ssr'`.

#### Scenario: Option rejected for SSR

- **WHEN** `distSubfolders` is set and `buildType` is `'ssr'`
- **THEN** config validation fails stating SSR output is always split into `client/` and `server/`

#### Scenario: Option accepted for either bundler

- **WHEN** `distSubfolders` is `true`, `buildType` is not `'ssr'`, and `bundler` is `'vite'` or `'webpack'`
- **THEN** config validation passes

### Requirement: Subfolder layout separates rendered documents from client assets

When the option is `true`, `sku build` for a static app MUST write HTML documents (and their metadata files) under `rendered/` in the build target, and every other emitted file under `client/`.

Document paths inside `rendered/` MUST be the paths the legacy layout places directly under the build target.

Files from `public/` MUST be copied into `client/`.

When the option is `false` or unset, the build output MUST be unchanged.

#### Scenario: Build with environments

- **WHEN** the option is `true`, `environments` is `['staging', 'production']`, and the user runs `sku build`
- **THEN** HTML is written under `rendered/staging/` and `rendered/production/`
- **AND** JS, CSS and `public/` files are under `client/`
- **AND** no HTML file is under `client/`
- **AND** no build intermediates (such as the Vite manifest or prerender bundle) remain in the build target

#### Scenario: Build without environments

- **WHEN** the option is `true`, `environments` is empty, and the user runs `sku build`
- **THEN** HTML is written under `rendered/` one level higher than it would be with an environment (for example `rendered/index.html`)
- **AND** assets are under `client/`

#### Scenario: Build with webpack

- **WHEN** the option is `true`, `bundler` is `'webpack'`, and the user runs `sku build`
- **THEN** HTML is written under `rendered/` and assets under `client/`, as for Vite

#### Scenario: Option off keeps the legacy layout

- **WHEN** the option is unset and the user runs `sku build` for a static app
- **THEN** HTML and assets are written to the build target as before

### Requirement: Dist subfolder names are reserved environment names

Config validation MUST fail if `environments` contains `client`, `rendered` or `server`, regardless of the value of `distSubfolders`.

#### Scenario: Reserved environment rejected

- **WHEN** `environments` contains `client`, `rendered` or `server`
- **THEN** config validation fails stating that the name is reserved

### Requirement: HTML in public is rejected

When the option is `true`, `sku build` MUST fail before building if `public/` (including nested folders) contains a file ending in `.html` (case-insensitive). This applies to both bundlers.

#### Scenario: Public HTML fails the build

- **WHEN** the option is `true` and `public/` contains `legacy.html`
- **THEN** `sku build` fails before the bundler build runs
- **AND** the error names the offending file and states that HTML must not be in `public/`

### Requirement: `sku serve` serves both layouts

`sku serve` MUST serve built apps from the legacy layout and from the subfolder layout.

For the subfolder layout, routes MUST resolve to documents in `rendered/` and assets under `publicPath` MUST resolve to files in `client/`.

Metadata-driven response headers MUST apply to documents in both layouts.

#### Scenario: Serve subfolder layout

- **WHEN** an app was built with the option `true` and the user runs `sku serve`
- **THEN** requesting a route returns its document from `rendered/`
- **AND** requesting an asset under `publicPath` returns the file from `client/`

#### Scenario: Serve legacy layout

- **WHEN** an app was built with the option unset and the user runs `sku serve`
- **THEN** serving behaves as before
