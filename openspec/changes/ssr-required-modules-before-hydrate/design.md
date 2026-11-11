# Design

## Context

On each request, `getModuleIds` collects the matched routes' `handle.moduleId` values and the Vocab chunk name for the request language. `resolveAssets` walks those ids, and their manifest imports, into one flat `modulePreloads` list. Once flattened, the client can no longer tell which modules the render needed from which were only preloaded.

`ssr-client` only runs what it reaches itself: the entry's static imports and the matched routes' `lazy()` factories. The language chunk is a standalone Vite entry that nothing imports, so it never runs before `hydrateRoot`.

The static Vite path handles this already: `vite-client` awaits `import()` of every `script[data-required-chunk]` before starting. See `openspec/specs/vite-loadable-ready`.

## Goals / Non-Goals

**Goals:**

- One general rule: before hydrating, the client runs every module the server resolved for the render.

**Non-Goals:**

- Inferring "required" from file names such as `-translations-`.
- Changing which ids `getModuleIds` collects.

## Decisions

### Keep the server's module ids as the required list, not just the language

`resolveAssets` also returns `requiredModules`: the output file of each id that `moduleIds` resolves to (route modules and the language chunk), with `publicPath` applied. The manifest imports it walks are not added to this list, because importing a module runs its static imports anyway.

Alternative: serialise only a `languageChunk` URL, as the issue suggests. Rejected because it special-cases Vocab. The next module a render depends on, for example an explicit `handle.moduleId` on a route without `lazy`, would hit the same bug.

### Serialise the list in `__SKU_DOCUMENT_ASSETS__`, and keep the preload links

`requiredModules` goes into the existing `DocumentAssets` object. The client already reads that object for `DocumentAssetLinks`, so the rendered `<head>` does not change. Required modules also stay in `modulePreloads`, so the browser starts downloading them before the entry runs.

Alternative: render `<script type="module" async data-required-chunk>` tags, as the static path does. Rejected because the SSR client would still have to await those modules before hydrating. The tags would also have to match during hydration and get a CSP nonce. A serialised list does neither.

### Start the imports early and await them before `hydrateRoot`

`ssr-client` starts `import()` of every `requiredModules` URL as soon as `hydrate` begins. It awaits them together with the lazy route modules, before creating the router. The downloads were started by the `modulepreload` links, so waiting adds little time.

Lazy route modules end up on both lists. The browser's module map stores each module once per resolved URL, so importing one twice does not run it twice.

### Failure behaves like a failed lazy route

If a required import rejects, `hydrate` rejects and logs the error, which is what a failed `lazy()` does today. If the client hydrated without that module, it would produce the same mismatch this change fixes.

## Risks / Trade-offs

- [The `publicPath` URL for a module differs from the URL Vite's dynamic import resolves, so the module runs twice] → Both URLs are built from `publicPath` plus the manifest file. The `ssr-document` browser test hydrates lazy routes and fails on page errors.
- [A heavy `handle.moduleId` on a route without `lazy` now delays hydration] → The server already rendered with that module, so the client needs it to hydrate the same markup.
