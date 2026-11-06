# Proposal

## Why

Production Vite SSR pages hydrate before running every module the server rendered with. The Vocab language chunk is only `modulepreload`ed, never run, so translated text renders as fallback on the client, and every translated page throws React error #418.
The same gap applies to any route `handle.moduleId` that the client does not import before hydrating.

## What Changes

- The SSR server records which modules it rendered the page with: each matched route `handle.moduleId` and the language chunk. It sends that list to the client with the document assets.
- The SSR client imports and runs every module on that list before `hydrateRoot`. Language chunks are not special-cased. This matches the static Vite path, which waits for every `data-required-chunk` before starting.
- Those modules stay in `modulePreloads`, so the HTML still starts their downloads from `<head>`.
- A browser test hydrates a translated route from a production build. The server runs from a copy of `dist/` with no `node_modules`, and the test fails on any hydration or console error. It is already committed, and fails until this change lands.

## Non-goals

- Changing `modulepreload` or CSS output, or which modules the server collects.
- Changing the static Vite or webpack paths.
- Changing Vocab, or loading translations for client-side navigations.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ssr`: production hydration waits for every module the server rendered the page with.

## Impact

- Code: `resolveAssets`, `DocumentAssets`, `render` and the `ssr-client` entry in `packages/sku/src/services/vite/`.
- Public API: none. The serialised `__SKU_DOCUMENT_ASSETS__` gains a field, but it is internal to sku.
- Tests: unit tests for `resolveAssets` and `render`, and the new browser test in `tests/browser/translations.test.ts`.
- Changeset: `patch` for `sku`.
- Docs: none.
