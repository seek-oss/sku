# Tasks

## 1. Config surface

- [x] 1.1 Add `cspExtraSources` and `cspReportOnlyExtraSources` to `types.ts` (with JSDoc noting SSR only, and marking the script-host options as non-SSR only), `configSchema.ts` and `defaultSkuConfig.ts`, and verify `pnpm --filter sku typecheck` passes
- [x] 1.2 Validate supported directive names, and reject quoted sources and bare `*`; verify with new cases in `validateConfig.test.ts`
- [x] 1.3 In `validateConfig.ts`, reject the script-host options for SSR apps and the extra-sources options for non-SSR apps, with errors naming the replacement; verify with `validateConfig.test.ts` cases for both directions
- [x] 1.4 Resolve both maps in `createSkuContext.ts`, with Report-Only defaulting to enforcing, and verify with a context unit test

## 2. SSR policy

- [x] 2.1 Switch `buildContentSecurityPolicy` / `buildCspHeaders` in `vite/ssr/csp.ts` to `extraSources` maps: append extras after sku's own sources (deduplicated), and emit missing supported directives as `'self'` plus extras; verify with unit tests covering the spec scenarios, including `script-src` and dev `ws: wss:`
- [x] 2.2 Pass the resolved maps through `ssr.ts`, `createDevSsrServer.ts`, `startProductionSsrServer.ts`, `listen.ts` and `createHtmlRenderMiddleware.ts` in place of the script-host fields; verify `ssrServerShared.test.ts` and `requestContext.test.ts` pass with updated inputs
- [x] 2.3 Migrate `fixtures/ssr-document/sku.config.ts` to `cspExtraSources` / `cspReportOnlyExtraSources` (including a `connect-src` entry), assert both headers in `tests/browser/ssr-document.test.ts`, and verify that test passes

## 3. Docs and release

- [x] 3.1 Document both options in `site/docs/configuration.md`, mark the script-host options as non-SSR, and add an "Extra sources (SSR)" section to `site/docs/csp.md` covering supported directives, the `'self'` default and the `connect-src` security trade-off; verify with `pnpm --filter site build`
- [x] 3.2 Add a `minor` changeset for `sku` with a `connect-src` example and a before/after migration for SSR apps using `cspExtraScriptSrcHosts`, and verify `pnpm changeset status` lists it

## Workflow follow-up

- Archive the change after review and release.
