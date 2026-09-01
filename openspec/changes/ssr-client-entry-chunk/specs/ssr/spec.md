## ADDED Requirements

### Requirement: Production Document bootstrap is the sku SSR client entry

Production SSR MUST use the Vite client manifest chunk named `ssr-client` as the Document bootstrap module.

Sku MUST NOT select the bootstrap module by taking the first `isEntry` chunk.

#### Scenario: Other isEntry chunks do not become bootstrap

- **WHEN** the production client manifest contains additional chunks marked as entries
- **THEN** the Document bootstrap module is the `ssr-client` chunk

#### Scenario: Missing ssr-client entry fails start

- **WHEN** the production client manifest has no chunk named `ssr-client`
- **THEN** production server start fails
