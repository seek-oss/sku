## Context

Production SSR loads Document `bootstrapModules` from the baked Vite client manifest (`findEntryChunk` in `startProductionSsrServer`).

The client environment’s Rolldown `input` was a **string path**: `require.resolve('#entries/ssr-client')`. Other plugins or split points can also emit `isEntry` chunks. `Object.values(manifest).find(chunk => chunk.isEntry)` returns whichever of those appears first, which is not an identification of sku’s client entry.

`isEntry` means “this chunk was an entry or `emitFile`,” not “this is sku’s SSR client.”

### Where `ssr-client` comes from

Sku **sets** it as the Rolldown input object key:

```
input: { 'ssr-client': require.resolve('#entries/ssr-client') }
```

That packaged file is `dist/entries/ssr-client.mjs` (tsdown entry `entries/ssr-client` + `#entries/*`). `entryFileNames: '[name]-[hash].js'` then uses that key as `[name]`. Vite’s `ManifestChunk.name` matches, and the manifest key is that same name.

Production lookup is `findManifestChunk(manifest, SSR_CLIENT_CHUNK_NAME)` (manifest key, then `chunk.name`). It does not filter on `isEntry`. One constant is shared by the input key and the lookup.

`sku start` does not use this path. It bootstraps `/@vite/client` plus `#entries/ssr-client.dev`.

## Goals / Non-Goals

**Goals:**

- Production Document bootstrap is sku’s SSR client even when other `isEntry` chunks exist.
- The chunk name is authored at the Rolldown input, not inferred from `ssr-client.mjs`.
- Fail loudly if that chunk is missing.

**Non-Goals:**

- A sidecar file that records the Vite manifest key for start-time indexing.
- Changing start-mode bootstrap.
- Renaming the packaged module.

## Decisions

### Named Rolldown input

`input: { [SSR_CLIENT_CHUNK_NAME]: ssrClientEntry }` makes the chunk name a sku contract at the same place as the module path. Alternative: string `input` and infer `[name]` from `ssr-client.mjs` (filename coincidence).

### Reuse `findManifestChunk` for `'ssr-client'`

Positive identification of the known sku entry via the same key-then-name lookup used for route `moduleId`s. Alternatives: first `isEntry` (wrong whenever extra entries exist); exclude other chunk names by convention (not an identification of sku’s entry); require `isEntry` in addition to the name (`isEntry` is not identity).

## Risks / Trade-offs

- **[Risk]** Renaming the input key without updating lookup → production start throws. → One constant (`SSR_CLIENT_CHUNK_NAME`) shared by `input` and `findEntryChunk`.
- **[Trade-off]** Couples production start to sku’s entry input, not the consumer `clientEntry`. That is intended: the consumer file is pulled in through `__sku_alias__clientEntry` inside `ssr-client.tsx`.
