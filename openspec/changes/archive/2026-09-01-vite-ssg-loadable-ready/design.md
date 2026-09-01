## Context

See proposal.md for motivation.

Webpack SSG hydrates inside `@loadable/component`’s `loadableReady` from sku’s webpack client entry. Vite SSG already registers the language chunk on the Collector (`createPreRenderedHtml` → `getChunkName(language)`). Vocab message modules are side-effectful: if they have not evaluated, hydration sees different text than the prerendered HTML.

`@vocab/vite` (`vite-sync-translations-fix`) emits each language as a standalone `emitFile({ type: 'chunk' })` preload (`/@vocab/preload/<lang>-translations.js`, chunk name `getChunkName(lang)`). App `.vocab` files `import()` that file dynamically; it is not a static `imports` edge of the client entry. Rolldown treats the emitted facade as `isEntry`. The preload inlines messages into a global registry and must not import the client entry.

Relying on document order of module scripts is not a substitute: webpack’s contract is an explicit wait. Sorting body scripts (client-entry last, or by Vite `isEntry`) is not necessary for that wait. Module scripts are deferred, so after parse the client already sees every tagged `src`, and `import()` evaluates them regardless of tag order. Keep emitting those body `<script type="module">` tags; they are how the wait finds URLs. Head `modulepreload` fetches but does not evaluate.

SSG apps do not call `loadableReady`; webpack SSG does not either. A public Vite export would be API surface for callers this change does not need.

## Goals / Non-Goals

**Goals:**

- Vite SSG production hydration waits until Collector-registered chunks (vocab + loadable) have evaluated, matching webpack.
- Registered standalone chunks (Vite entries that are not the sku client, not in the client static import graph) still emit a tagged script the wait can see.
- Sku owns that wait in the Vite client entry so typical SSG `client.tsx` files stay a plain `hydrateRoot` export.

**Non-Goals:**

- Exporting `loadableReady` (or equivalent) from `@sku-lib/vite`.
- A second Collector API (`registerStandalone`) or vocab-specific filename matching.
- Changing the webpack→Vite loadable codemod or `--convert-loadable` plugin.
- Webpack `loadableReady` or `@vocab/vite` internals.
- Vite SSR Document hydration (change `vite-ssr`).
- Requiring SSG apps to wrap `hydrateRoot` themselves.
- A full `@loadable/component` clone (`__LOADABLE_REQUIRED_CHUNKS__`, namespaces, etc.).

## Decisions

### 1. Wait by `import()`ing tagged chunk script URLs, inside sku

**Choice:** Collector marks registered scripts with `data-required-chunk` (HTML contract only), excluding the sku client entry. Sku’s Vite client queries `script[data-required-chunk][src]`, `import()`s each `src` (with `/* @vite-ignore */` so Vite does not try to bundle it), then hydrates. Same URL hits the browser module map, so this awaits the tags already on the page rather than fetching a second copy. The helper is private to sku (Vite client entry or a sibling module under `packages/sku`); it is not part of `@sku-lib/vite/loadable`. Head `modulepreload` may still fetch the file; it does not evaluate it.

**Alternatives considered:**

- Export `loadableReady` from `@sku-lib/vite/loadable` for webpack API parity and leftover consumer calls — not needed for SSG; sku already wraps the client. Adds a public API, minor version, and docs for no current Vite caller.
- Trust document order of `<script type="module">` — already fails in production multi-language SSG; worse when language and client are both Vite entries.
- Inline `__LOADABLE_REQUIRED_CHUNKS__` like webpack — extra inline script (CSP), redundant with `src` already on the tags.
- Have the client entry `import()` the language from client context — vocab-only; loadable modules still race; language is not always in context.

**Rationale:** Matches webpack’s “wait until required chunks exist in the runtime” without webpack chunk IDs or a new consumer export. Covers vocab (including standalone preloads) and loadable with one path.

### 2. Tag `register()` roots except the sku client entry file

**Choice:** Pass the registered module id only on the `register()` parse, not when walking `imports`. Set `data-required-chunk` when the script is that register root **and** its output file is not the Collector’s client-entry file. Do **not** use Vite `isEntry` or `isDynamicEntry` as the exclusion. Keep a single `Collector.register(id)` path; do not add `registerStandalone`.

`register(getChunkName(language))` still resolves the language preload via the Vite manifest key or `chunk.name`. If a registered id exists in the manifest, the Collector MUST emit and tag it (silent no-op on a present chunk is a bug).

**Alternatives considered:**

- Never tag Vite `isEntry` scripts — deadlocks the client, but also drops tags on vocab’s emitted language entries.
- Match `*-translations` filenames — couples Collector to vocab; other standalone registered chunks stay untagged.
- Trust document order of `<script type="module">` instead of an explicit wait — already fails in production multi-language SSG.

**Rationale:** The hang is only `import()`ing the module that is waiting. Vocab’s preload is a Vite entry and must still be waited on. Recursive imports of a registered loadable stay untagged so shared runtime with the client is not pulled into the wait set.

### 3. Do not sort body script tags; `async` on tagged preload scripts

**Choice:** Emit Collector body `<script type="module">` tags in insertion order. Do not sort on client-entry, Vite `isEntry`, or any other comparator. The wait set is every `data-required-chunk` script that is not the sku client entry. Drop `sortInjectableScript` and the `isClientEntry` field that existed only to feed it. Keep using the client-entry file to _exclude_ that script from `data-required-chunk`.

Put `async` on Collector body `<script type="module">` tags that have `data-required-chunk`. Do not put `async` on the sku client entry (it stays deferred so the wait sees every tagged `src` after parse). This matches webpack `@loadable/server` chunk scripts (`<script async data-chunk>`). `async` module scripts do not preserve document order, which is another reason not to sort.

**Alternatives considered:**

- Sort injectable scripts client-entry last as belt-and-suspenders — not needed once the client `import()`s tagged `src`s; a second order contract is what made the old `isEntry` comparator look load-bearing. A small latency win (language evaluates before the client module body) is milliseconds, not correctness.
- Omit body scripts and read URLs from `modulepreload` links — out of scope; body script tags stay the HTML contract for the wait.
- `async` on the client entry as well — full webpack `getScriptTags()` parity, but then the wait must not query tags until the document is parsed (e.g. `DOMContentLoaded`), or tagged scripts must appear before the client. Out of scope unless we want that extra guard.

**Rationale:** `Promise.all(import(src))` does not care about document order. Keeping a sort implies order matters and recreates the `isEntry` confusion. Tagged chunks can evaluate as soon as they fetch, like webpack; the deferred client keeps the wait correct without sorting.

### 4. Sku Vite client wraps hydration; consumers do not

**Choice:** `vite-client.tsx` runs the private wait around reading client context and `client()`, same shape as webpack’s client entry. Dev prerender uses an empty manifest, so there are no tagged scripts and the wait is a no-op.

**Rationale:** SSG apps already export a hydrate function; webpack never asked them to wait. Webpack SSR entries that import `loadableReady` from `sku/@loadable/component` are unchanged (Vite SSR is out of scope).

## Risks / Trade-offs

- [Tagging the client entry deadlocks hydration] → Mitigation: never set `data-required-chunk` on the Collector client-entry file; do not forward the registered id into import recursion.
- [Vite `isEntry` language preloads silently lose `data-required-chunk`] → Mitigation: exclude only the sku client entry file, not all Vite entries.
- [`register(name)` misses the chunk if the manifest has no matching `name` or key] → Mitigation: keep lookup by manifest key and `chunk.name`; treat a found registered module as must-emit; cover with translations snapshots.
- [`import(src)` is bundled or warned by Vite] → Mitigation: `/* @vite-ignore */`; runtime URLs are absolute `script.src` values from the document.
- [`data-required-chunk` snapshot churn] → Mitigation: expected HTML delta; update Vite SSG snapshots that include those tags.
- [CSP] → Mitigation: attribute on an existing `src` script; no new inline script. Hash/nonce behaviour for inline scripts is unchanged.
- [Vite SSR or custom client entries later need a public wait] → Mitigation: keep the helper easy to lift; do not invent the export until a real Vite caller exists.

## Migration Plan

1. Ship Collector tagging + sku Vite client wait together (SSG apps get the fix with a sku bump; they do not change `client.tsx`).
2. Patch changesets for `@sku-lib/vite` (markup) and `sku` (client wait). No docs for a new export.
3. Rollback: revert the change; hydration races return. No data migration.

## Open Questions

- None blocking. If Vite SSR later needs a consumer-facing wait, that is a separate API decision.
