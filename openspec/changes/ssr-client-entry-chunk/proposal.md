## Why

Production SSR picks Document `bootstrapModules` from the first `isEntry` chunk in the Vite client manifest. The client build can emit more than one `isEntry` chunk, so that first match is not necessarily sku’s SSR client.

## What Changes

- Identify the production client bootstrap as the manifest chunk named `ssr-client` via `findManifestChunk` (manifest key, then `chunk.name`).
- Stop treating “first `isEntry`” (or any exclusion of other chunk names) as the client entry.
- Fail production server start if that chunk is missing.

## Non-goals

- Changing `sku start` bootstrap (`/@vite/client` + `ssr-client.dev`).
- Renaming the packaged SSR client entry.
- Switching Vite `input` to a named object.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `ssr`: Production Document bootstrap comes from the sku-owned SSR client entry in the client manifest, not from any other `isEntry` chunk.

## Impact

- `findEntryChunk` / production SSR server start, plus unit tests.
- No public API, docs, or config change.
