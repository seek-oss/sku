# Tasks

## 1. Bundle the SSR server build

- [x] 1.1 In the SSR build environment, set `resolve.noExternal: true` (Node built-ins external) and keep the existing `compilePackages` / vanilla-extract `noExternal` for `sku start` only. Verify: `fixtures/ssr-data` `dist/server` has no bare imports of `react`, `react-router`, `react-dom` or `express`, and `sku start` still serves it.
- [x] 1.2 Add a `tests/browser` SSR test that copies `dist/server` to a temp directory outside the repo, runs `node server.js` with `PORT`, and asserts a 200 streamed document. Verify: the test passes, and fails on `main`.
- [x] 1.3 Clear the SSR environment's explicit `resolve.external` in the build so plugin-added externals (vanilla-extract, `vite`) are bundled. Verify: a `braid-design-system` SSR build-and-serve test runs from an isolated copy, and its build imports `@vanilla-extract/css/recipe` without the change.
- [x] 1.4 Dedupe `react`, `react-dom` and `react-router` in the SSR build. Verify: a production-like app built with a linked sku bundles one copy of each and renders without hook errors.

## 2. Real-world check

- [x] 2.1 Build a production-like Managed Data Mode app with Apollo streaming, Braid, Vocab `languages`, a pino-based logger and server-side auth middleware on a linked sku, then run `dist/server` from an isolated copy. Verify: `GET /` returns 200, and any failure is fixed in sku or recorded as a documented exception. Result: `GET /` and a second route returned 200 with no route errors. Auth secret lookups failed only because the local machine has no cloud credentials. This check found the gaps fixed in 1.3 and 1.4.
- [x] 2.2 Record the `dist/server` size and `sku build` time for that app, before and after. Verify: the numbers are in the PR description. Result: 5.2 MB / 16 files before (which did not start without `node_modules`), 20 MB / 52 files after, including inline sourcemaps. Build time stayed at about 3–4 s.

## 3. Docs and release

- [x] 3.1 Update `site/docs/ssr/deploy-to-production.md`: remove "plus production `node_modules`", and document the deploy contract (`server/server.js`, the manifest in `server/`, `PORT`), plus the APM note that bundled packages are not auto-instrumented. Verify: the docs match the deploy requirement in the spec delta.
- [x] 3.2 Update `site/docs/ssr/migrate-from-webpack-ssr.md` to say production needs only `server/`. Verify: `rg "node_modules" site/docs/ssr` returns no deploy instructions that require it.
- [x] 3.3 Add a sku minor changeset describing self-contained SSR server output. Verify: `pnpm changeset status` lists it.

## Workflow follow-up

- Confirm with the deploy tooling that reported the issue that `dist/server` runs in their container image before archive.
- Archive the change after review and release.
