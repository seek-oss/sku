# Spec Delta

## ADDED Requirements

### Requirement: Production hydration waits for the modules the page was rendered with

Before hydrating a production SSR page, the browser MUST run every module that sku resolved for that page's render. That means each matched route's `handle.moduleId` and, when `getLanguage` returns a language, that language's Vocab chunk. A `modulepreload` link alone MUST NOT count as loaded. Hydration MUST NOT replace server-rendered text with fallback text, and MUST NOT report a hydration mismatch.

#### Scenario: Translated route hydrates from a standalone production server

- **GIVEN** a Managed Data Mode SSR app with `languages` configured and `getLanguage` returning `en` or `fr`
- **AND** the production build runs from a copy of the build output with no `node_modules`
- **WHEN** a browser loads a translated route and hydrates
- **THEN** the hydrated page shows the same translated text as the server HTML
- **AND** the page reports no page errors or console errors

#### Scenario: Page with no language or route modules still hydrates

- **GIVEN** a production SSR page where `getLanguage` returns no language and no matched route has a `handle.moduleId`
- **WHEN** a browser loads the page
- **THEN** the client hydrates without waiting on any extra modules

#### Scenario: Development is unaffected

- **WHEN** `sku start` serves an SSR page without a client manifest
- **THEN** the client hydrates without waiting on any extra modules
