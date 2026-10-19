## Purpose

Lets static Vite apps emit a build output that separates HTML documents from static resources, so it can be deployed from `dist/documents/<environment>` and `dist/resources`. The layout is experimental and opt-in.

## ADDED Requirements

### Requirement: Experimental option enables the subfolder layout

Sku MUST accept `__UNSAFE_EXPERIMENTAL__distSubfolders` as a boolean that defaults to `false`.

Config validation MUST fail when the option is set with `bundler: 'webpack'`.

Config validation MUST fail when the option is set with `buildType: 'ssr'`.

The option MUST be documented as experimental and removable without notice in a non-major release.

#### Scenario: Option rejected for webpack

- **WHEN** `__UNSAFE_EXPERIMENTAL__distSubfolders` is set and `bundler` is `'webpack'`
- **THEN** config validation fails stating the option requires the `vite` bundler

#### Scenario: Option rejected for SSR

- **WHEN** `__UNSAFE_EXPERIMENTAL__distSubfolders` is set and `buildType` is `'ssr'`
- **THEN** config validation fails stating SSR always uses the subfolder layout

### Requirement: Subfolder layout separates documents from resources

When the option is `true`, `sku build` for a static Vite app MUST write HTML documents (and their metadata files) under `documents/` in the build target, and every other emitted file under `resources/`.

Document paths inside `documents/` MUST be the paths the legacy layout places directly under the build target.

Files from `public/` MUST be copied into `resources/`.

When the option is `false` or unset, the build output MUST be unchanged.

Webpack build output MUST be unchanged.

#### Scenario: Build with environments

- **WHEN** the option is `true`, `environments` is `['staging', 'production']`, and the user runs `sku build`
- **THEN** HTML is written under `documents/staging/` and `documents/production/`
- **AND** JS, CSS and `public/` files are under `resources/`
- **AND** no HTML file is under `resources/`
- **AND** no build intermediates (such as the Vite manifest or prerender bundle) remain in the build target

#### Scenario: Build without environments

- **WHEN** the option is `true`, `environments` is empty, and the user runs `sku build`
- **THEN** HTML is written under `documents/` one level higher than it would be with an environment (for example `documents/index.html`)
- **AND** assets are under `resources/`

#### Scenario: Option off keeps the legacy layout

- **WHEN** the option is unset and the user runs `sku build` for a static Vite app
- **THEN** HTML and assets are written to the build target as before

### Requirement: `resources` is a reserved environment name

When the option is `true`, config validation MUST fail if `environments` contains `resources`.

#### Scenario: Reserved environment rejected

- **WHEN** the option is `true` and `environments` contains `resources`
- **THEN** config validation fails stating that `resources` is reserved

### Requirement: HTML in public is rejected

When the option is `true`, `sku build` MUST fail before building if `public/` (including nested folders) contains a file ending in `.html` (case-insensitive).

#### Scenario: Public HTML fails the build

- **WHEN** the option is `true` and `public/` contains `legacy.html`
- **THEN** `sku build` fails before the Vite build runs
- **AND** the error names the offending file and states that HTML must not be in `public/`

### Requirement: `sku serve` serves both layouts

`sku serve` MUST serve built apps from the legacy layout and from the subfolder layout.

For the subfolder layout, routes MUST resolve to documents in `documents/` and assets under `publicPath` MUST resolve to files in `resources/`.

Metadata-driven response headers MUST apply to documents in both layouts.

#### Scenario: Serve subfolder layout

- **WHEN** an app was built with the option `true` and the user runs `sku serve`
- **THEN** requesting a route returns its document from `documents/`
- **AND** requesting an asset under `publicPath` returns the file from `resources/`

#### Scenario: Serve legacy layout

- **WHEN** an app was built with webpack, or with Vite and the option unset, and the user runs `sku serve`
- **THEN** serving behaves as before
