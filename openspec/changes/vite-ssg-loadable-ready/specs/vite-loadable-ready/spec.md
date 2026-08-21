## ADDED Requirements

### Requirement: Vite SSG production hydration waits for language translation chunks

On a production Vite SSG page that was prerendered for a language, the browser MUST evaluate that language’s translation message chunk before hydrating. Hydration MUST NOT replace prerendered translated text with untranslated or fallback text, and MUST NOT report a hydration mismatch caused by missing messages.

#### Scenario: Multi-language production page hydrates with prerendered translations

- **GIVEN** a Vite app with `languages` configured
- **AND** a route prerendered for a language (for example `en` or `fr`)
- **WHEN** a browser loads the production SSG HTML for that route
- **THEN** the hydrated document shows the same translated text as the prerendered markup
- **AND** the page does not report a hydration mismatch from missing translation messages

### Requirement: Vite SSG hydrates when no extra chunks were registered

When a Vite SSG page has no language translation chunk and no code-split modules registered during prerender, the client MUST still hydrate. Vite `start` (empty asset manifest) MUST also hydrate without waiting for production chunk tags.

#### Scenario: Page without language or loadable chunks hydrates

- **GIVEN** a Vite SSG production page with no registered language or code-split chunks
- **WHEN** a browser loads the page
- **THEN** the app hydrates

#### Scenario: Vite start hydrates without production chunk tags

- **GIVEN** a Vite app running under `sku start`
- **WHEN** a browser loads a prerendered route
- **THEN** the app hydrates

### Requirement: Hydration is not blocked on the client entry script

Waiting for prerendered chunks MUST NOT wait for the main Vite client entry script. The page MUST hydrate rather than hang.

#### Scenario: Shared runtime between a translation chunk and the client entry still hydrates

- **GIVEN** a production Vite SSG page whose language translation chunk shares modules with the client entry
- **WHEN** a browser loads the page
- **THEN** hydration completes
- **AND** the prerendered translated text is preserved
