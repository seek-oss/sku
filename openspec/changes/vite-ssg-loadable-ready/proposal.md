## Why

Vite SSG production builds of multi-language apps hydrate before the vocab translation chunk has run, which mismatches webpack (where sku’s client entry waits on `loadableReady`) and causes hydration errors. Sku’s Vite client entry has no equivalent wait.

## What Changes

- Tag Collector-registered chunk `<script type="module">` tags so sku’s Vite client can find them. Do not tag the client entry (awaiting it would deadlock).
- Wait for those chunks in sku’s Vite client entry before reading client context and calling `client()`, matching webpack. Typical SSG `client.tsx` files stay a plain `hydrateRoot` export.
- Do **not** export a Vite `loadableReady` from `@sku-lib/vite`. The wait is sku-internal. Leave the webpack→Vite loadable codemod / `--convert-loadable` plugin as they are.
- Patch changesets for `sku` and `@sku-lib/vite` (Collector markup only). Not **BREAKING**. No new public API or docs page.

## Capabilities

### New Capabilities

- `vite-loadable-ready`: Client hydration on Vite SSG production pages waits for Collector-registered chunks (vocab language chunks and loadable modules) to evaluate first; apps without those chunks hydrate immediately.

### Modified Capabilities

- (none)

## Impact

- `@sku-lib/vite` Collector script markup (`data-chunk` on registered non-entry scripts).
- Sku Vite client entry (private wait).
- Browser snapshots that include prerendered `<script type="module">` tags.
- **Out of scope:** public `loadableReady` on `@sku-lib/vite/loadable`; webpack `loadableReady`; `@vocab/vite` itself; Vite SSR (tracked in `vite-ssr`); requiring SSG apps to wrap `hydrateRoot` themselves; rewriting leftover `sku/@loadable/component` `loadableReady` imports.
