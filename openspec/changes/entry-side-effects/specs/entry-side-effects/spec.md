## Purpose

Lets Vite apps list isomorphic modules that sku evaluates before any consumer module, so CSS resets and similar side effects are first on static and SSR graphs.

## ADDED Requirements

### Requirement: Config lists isomorphic entry side effects

Vite apps MUST be able to set `entrySideEffects` to an array of module specifiers.
The default MUST be an empty array.
An empty array MUST be a no-op.
Webpack MUST ignore the option.

#### Scenario: Default is empty

- **WHEN** an app omits `entrySideEffects`
- **THEN** sku injects no extra entry side-effect modules

#### Scenario: Webpack does not apply the option

- **WHEN** `bundler` is `webpack`
- **AND** `entrySideEffects` is non-empty
- **THEN** those modules are not prepended to webpack entries

### Requirement: Listed modules evaluate first on Vite graphs

On Vite static and Vite SSR, sku MUST evaluate `entrySideEffects` modules before consumer modules on sku-owned entries.
That includes the browser client entry, the SSR server entry, and the static `sku start` render graph.
Sku MUST preserve array order.
Sku MUST resolve specifiers from the app.
A specifier that cannot be resolved MUST fail `sku start` and `sku build`.

#### Scenario: SSR start evaluates side effects before consumer Braid imports

- **GIVEN** a Vite SSR Braid app with `entrySideEffects` including `braid-design-system/reset`
- **AND** consumer modules import Braid without importing reset
- **WHEN** the app runs `sku start`
- **THEN** the Braid reset module evaluates before those consumer Braid imports
- **AND** start does not fail with Braid components imported before reset

#### Scenario: Static Vite client evaluates side effects first

- **GIVEN** a Vite static app with a non-empty `entrySideEffects` list
- **WHEN** the browser loads the sku client entry
- **THEN** those modules evaluate before the consumer `clientEntry`

#### Scenario: SSR server graph evaluates side effects first

- **GIVEN** a Vite SSR app with a non-empty `entrySideEffects` list
- **WHEN** sku evaluates the SSR server entry
- **THEN** those modules evaluate before the consumer routes and server entries

#### Scenario: Static start render graph evaluates side effects first

- **GIVEN** a Vite static app with a non-empty `entrySideEffects` list
- **WHEN** sku start evaluates the Node render graph
- **THEN** those modules evaluate before the consumer `renderEntry`

#### Scenario: Missing specifier fails

- **WHEN** `entrySideEffects` includes a specifier that cannot be resolved from the app
- **THEN** `sku start` and `sku build` fail

### Requirement: Start CSS collection includes side effects first

On `sku start`, collected document CSS MUST include styles from `entrySideEffects` modules before styles from later modules in the same graph.

#### Scenario: Reset CSS precedes component CSS in start stylesheet

- **GIVEN** `entrySideEffects` includes a CSS-emitting reset module
- **AND** a later graph module emits component CSS
- **WHEN** sku start serves the collected document stylesheet
- **THEN** the reset CSS appears before that component CSS
