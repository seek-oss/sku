## Context

Webpack SSG hydrates inside `@loadable/component`’s `loadableReady` from sku’s webpack client entry. That waits for extractor-registered chunks — including the vocab language chunk added in the webpack render entry — so translation messages are in the registry before React hydrates.

Vite SSG already registers the same language chunk on the Collector (`createPreRenderedHtml` → `getChunkName(language)`) and emits it as `<script type="module">`. Sku’s Vite client entry then calls the app `client()` immediately. Vocab message chunks are side-effect modules; if they have not evaluated, hydration sees different text than the prerendered HTML.

Relying on document order of module scripts is not a substitute: the Collector’s script sort is a one-argument comparator, language chunks can share graph nodes with the client entry, and webpack’s contract is an explicit wait, not “hope the tags ran first.”

SSG apps do not call `loadableReady`; webpack SSG does not either. A public Vite export would be API surface for callers this change does not need.

## Goals / Non-Goals

**Goals:**

- Vite SSG production hydration waits until Collector-registered chunks (vocab + loadable) have evaluated, matching webpack.
- Sku owns that wait in the Vite client entry so typical SSG `client.tsx` files stay a plain `hydrateRoot` export.

**Non-Goals:**

- Exporting `loadableReady` (or equivalent) from `@sku-lib/vite`.
- Changing the webpack→Vite loadable codemod or `--convert-loadable` plugin.
- Webpack `loadableReady` or `@vocab/vite` internals.
- Vite SSR Document hydration (change `vite-ssr`).
- Requiring SSG apps to wrap `hydrateRoot` themselves.
- A full `@loadable/component` clone (`__LOADABLE_REQUIRED_CHUNKS__`, namespaces, etc.).

## Decisions

### 1. Wait by `import()`ing tagged chunk script URLs, inside sku

**Choice:** Collector marks registered, non-entry scripts with `data-chunk` (HTML contract only). Sku’s Vite client queries `script[data-chunk][src]`, `import()`s each `src` (with `/* @vite-ignore */` so Vite does not try to bundle it), then hydrates. Same URL hits the browser module map, so this awaits the tags already on the page rather than fetching a second copy. The helper is private to sku (Vite client entry or a sibling module under `packages/sku`); it is not part of `@sku-lib/vite/loadable`.

**Alternatives considered:**

- Export `loadableReady` from `@sku-lib/vite/loadable` for webpack API parity and leftover consumer calls — not needed for SSG; sku already wraps the client. Adds a public API, minor version, and docs for no current Vite caller.
- Trust document order of `<script type="module">` — already fails in production multi-language SSG; sort is unreliable.
- Inline `__LOADABLE_REQUIRED_CHUNKS__` like webpack — extra inline script (CSP), redundant with `src` already on the tags.
- Have the client entry `import()` the language from client context — vocab-only; loadable modules still race; language is not always in context.

**Rationale:** Matches webpack’s “wait until required chunks exist in the runtime” without webpack chunk IDs or a new consumer export. Covers vocab and loadable with one path.

### 2. Tag only `Collector.register()` modules, never the client entry or recursive imports

**Choice:** Pass the registered module id only on the `register()` parse, not when walking `imports`. Never set `data-chunk` on `isEntry` scripts.

**Rationale:** A language chunk’s static imports can include the client entry (shared runtime). Tagging that entry would make the sku wait `import()` the module that is itself waiting — hang. Importing the registered chunk already evaluates its static imports.

### 3. Sku Vite client wraps hydration; consumers do not

**Choice:** `vite-client.tsx` runs the private wait around reading client context and `client()`, same shape as webpack’s client entry. Dev prerender uses an empty manifest, so there are no tagged scripts and the wait is a no-op.

**Rationale:** SSG apps already export a hydrate function; webpack never asked them to wait. Webpack SSR entries that import `loadableReady` from `sku/@loadable/component` are unchanged (Vite SSR is out of scope).

## Risks / Trade-offs

- [Tagging the client entry deadlocks hydration] → Mitigation: never set `data-chunk` on entry scripts; do not forward the registered id into import recursion.
- [`import(src)` is bundled or warned by Vite] → Mitigation: `/* @vite-ignore */`; runtime URLs are absolute `script.src` values from the document.
- [`data-chunk` snapshot churn] → Mitigation: expected HTML delta; update Vite SSG snapshots that include those tags.
- [CSP] → Mitigation: attribute on an existing `src` script; no new inline script. Hash/nonce behaviour for inline scripts is unchanged.
- [Vite SSR or custom client entries later need a public wait] → Mitigation: keep the helper easy to lift; do not invent the export until a real Vite caller exists.

## Migration Plan

1. Ship Collector tagging + sku Vite client wait together (SSG apps get the fix with a sku bump; they do not change `client.tsx`).
2. Patch changesets for `@sku-lib/vite` (markup) and `sku` (client wait). No docs for a new export.
3. Rollback: revert the change; hydration races return. No data migration.

## Open Questions

- None blocking. If Vite SSR later needs a consumer-facing wait, that is a separate API decision.
