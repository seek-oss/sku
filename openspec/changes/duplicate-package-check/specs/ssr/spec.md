## ADDED Requirements

### Requirement: SSR bundles every Vanilla Extract user

An SSR build SHALL bundle every package that uses `@vanilla-extract/css` into the server build, including packages that use a second copy of it.

#### Scenario: Two copies of Vanilla Extract

- **GIVEN** package A uses `@vanilla-extract/css` 1.20.0
- **AND** package B uses `@vanilla-extract/css` 1.21.2
- **WHEN** an SSR `sku build` runs
- **THEN** the server build bundles both package A and package B
