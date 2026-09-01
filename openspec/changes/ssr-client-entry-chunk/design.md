## Context

Production SSR loads Document `bootstrapModules` from the baked Vite client manifest (`findEntryChunk` in `startProductionSsrServer`).

The client environment’s Rolldown `input` is a **string path**: `require.resolve('#entries/ssr-client')`. Other plugins or split points can also emit `isEntry` chunks. `Object.values(manifest).find(chunk => chunk.isEntry)` returns whichever of those appears first, which is not an identification of sku’s client entry.

`isEntry` means “this chunk was an entry or `emitFile`,” not “this is sku’s SSR client.”

### Where `ssr-client` comes from

The string is the packaged filename stem, not an app `clientEntry` and not a Vite `input` object key.

1. **tsdown entry** (`packages/sku/tsdown.config.ts`): `'entries/ssr-client': 'src/services/vite/entries/ssr-client.tsx'` emits `dist/entries/ssr-client.mjs`.
2. **Package import** (`packages/sku/package.json`): `"#entries/*": "./dist/entries/*.mjs"` so `#entries/ssr-client` resolves to that file.
3. **SSR client build** (`plugins/ssr.ts`): `rolldownOptions.input` is `require.resolve('#entries/ssr-client')` — a path string, not `{ 'ssr-client': path }`.
4. **Output pattern** (`plugins/build.ts`): `entryFileNames: '[name]-[hash].js'`. For a file input, Rolldown `[name]` is the basename without extension: `ssr-client.mjs` → **`ssr-client`**.
5. **Manifest**: that `[name]` is `ManifestChunk.name`. Production lookup is `findManifestChunk(manifest, 'ssr-client')` (manifest key, then `chunk.name`). It does not filter on `isEntry`.

`sku start` does not use this path. It bootstraps `/@vite/client` plus `#entries/ssr-client.dev`.

## Goals / Non-Goals

**Goals:**

- Production Document bootstrap is sku’s SSR client even when other `isEntry` chunks exist.
- Fail loudly if that chunk is missing.
- Record the name’s origin so it is not treated as a magic string with no source.

**Non-Goals:**

- Renaming the tsdown entry or switching Vite `input` to a named object (optional later; see decisions).
- Changing start-mode bootstrap.

## Decisions

### Reuse `findManifestChunk` for `'ssr-client'`

Positive identification of the known sku entry via the same key-then-name lookup used for route `moduleId`s. Alternatives: first `isEntry` (wrong whenever extra entries exist); exclude other chunk names by convention (not an identification of sku’s entry); require `isEntry` in addition to the name (`isEntry` is not identity). Matching the absolute-path manifest key is unnecessary: the filename stem already appears as `chunk.name`, and a later named `input` would hit the key path.

### Keep string `input` (name implied by filename)

Named `input: { 'ssr-client': ssrClientEntry }` would make the name explicit in the SSR plugin. Out of scope: today’s basename already produces `ssr-client`. If the packaged file is renamed, lookup and filename must move together.

## Risks / Trade-offs

- **[Risk]** Renaming `entries/ssr-client` without updating lookup → production start throws. → Keep the packaged stem and `SSR_CLIENT_CHUNK_NAME` in lockstep (or later use named `input`).
- **[Trade-off]** Couples production start to sku’s entry filename, not the consumer `clientEntry`. That is intended: the consumer file is pulled in through `__sku_alias__clientEntry` inside `ssr-client.tsx`.
