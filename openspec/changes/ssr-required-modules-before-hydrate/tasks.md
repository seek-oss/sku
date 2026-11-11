# Tasks

## 1. Regression test first

- [x] 1.1 Add a browser test in `tests/browser/translations.test.ts`. It copies the production `dist/` of the `translations` Vite SSR fixture to a temp directory with no `node_modules`, runs `server/server.mjs`, and hydrates `/en` and `/fr`. It must fail on React #418 before the fix: `pnpm test tests/browser/translations.test.ts -t "standalone production server"` shows 2 failures, both #418.
- [x] 1.2 Give the fixture root layout an inline icon (`<link rel="icon" href="data:,">`) so Chromium does not request `/favicon.ico`. Verify the dev snapshots change only by that link and the test reports no 404.

## 2. Server: record the modules the page was rendered with

- [x] 2.1 Add optional `requiredModules: string[]` to `DocumentAssets`. Have `resolveAssets` fill it with the `publicPath` file of each `moduleIds` entry it resolves, excluding manifest imports and the client entry. Verify with new cases in `resolveAssets.test.ts`: a route module and `en-translations` are listed, their imports are not, and unknown ids are skipped.
- [x] 2.2 Pass `requiredModules` through `render` into the serialised `__SKU_DOCUMENT_ASSETS__`. Verify a `render.test.tsx` case shows it in the bootstrap script and that `modulePreloads` is unchanged.

## 3. Client: wait before hydrating

- [x] 3.1 In `entries/ssr-client.tsx`, start `import()` of every `requiredModules` URL when `hydrate` begins, and await them with the lazy route modules before `createBrowserRouter`. Verify task 1.1's test passes.
- [x] 3.2 Verify nothing regressed in the other Vite SSR browser tests: `pnpm test tests/browser/ssr-document.test.ts tests/browser/ssr-data.test.ts tests/browser/ssr-sites.test.ts tests/browser/translations.test.ts`.

## 4. Release

- [x] 4.1 Add a `patch` changeset for `sku`, saying that production Vite SSR now runs the language chunk and route modules before hydrating, which fixes React #418 on translated pages. Verify with `pnpm changeset status`.

## Workflow follow-up

- Open a draft PR stacked on `csp-extra-sources-per-directive`.
- Once a snapshot is released, upgrade demo-candidate-app and confirm #418 stops in production RUM.
- Archive the change after review.
