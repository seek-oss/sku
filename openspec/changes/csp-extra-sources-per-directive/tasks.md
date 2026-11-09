# Tasks

## 1. Config surface

- [x] 1.1 Add `csp` to `types.ts` (with JSDoc noting SSR only, and marking the flat CSP options as non-SSR only), `configSchema.ts` and `defaultSkuConfig.ts`, and remove `cspExtraSources` and `cspReportOnlyExtraSources`; verify `pnpm --filter sku typecheck` passes
- [x] 1.2 Validate supported directive names, and reject quoted sources, bare `*` and schemes in `script-src`; verify with new cases in `validateConfig.test.ts`
- [x] 1.3 Apply the 1.2 validation to `csp.enforced.extraSources` and `csp.reportOnly.extraSources`, and require each `reportTo` to be an absolute `http:` or `https:` URL; verify with `validateConfig.test.ts` cases, including an endpoint name in `reportTo`
- [x] 1.4 In `validateConfig.ts`, reject every flat CSP option (`cspEnabled`, `cspExtraScriptSrcHosts`, `cspReportOnlyEnabled`, `cspReportOnlyExtraScriptSrcHosts`, `cspReportTo`, `cspReportOnlyReportTo`, `cspDelivery`) for SSR apps and `csp` for non-SSR apps, with errors naming the replacement; verify with `validateConfig.test.ts` cases for both directions
- [x] 1.5 Resolve `csp` into the context fields in `createSkuContext.ts`: `true` enables a policy with no extras or `report-to`, the policies don't inherit, and endpoints are named `csp` and `csp-report-only`; verify with context unit tests

## 2. SSR policy

- [x] 2.1 Switch `buildContentSecurityPolicy` / `buildCspHeaders` in `vite/ssr/csp.ts` to `extraSources` maps: append extras after sku's own sources (deduplicated), and emit missing supported directives as `'self'` plus extras; verify with unit tests covering the spec scenarios, including `script-src` and dev `ws: wss:`
- [x] 2.2 Pass the resolved maps through `ssr.ts`, `createDevSsrServer.ts`, `startProductionSsrServer.ts`, `listen.ts` and `createHtmlRenderMiddleware.ts` in place of the script-host fields; verify `ssrServerShared.test.ts` and `requestContext.test.ts` pass with updated inputs
- [x] 2.3 Migrate `fixtures/ssr-document/sku.config.ts` to `csp` (including a `connect-src` entry and a `reportTo` URL on both policies), assert both CSP headers and `Reporting-Endpoints` in `tests/browser/ssr-document.test.ts`, and verify that test passes

## 3. Docs and release

- [x] 3.1 Document `csp` in `site/docs/configuration.md`, mark the flat CSP options as non-SSR, and rewrite the SSR sections of `site/docs/csp.md` for `csp`, covering supported directives, the `'self'` default, `reportTo` URLs and the `connect-src` security trade-off; verify with `pnpm --filter site build`
- [x] 3.2 Update the `minor` changeset for `sku` with a `csp` example and a migration table from each flat option to its `csp` key, including setting values on both policies where Report-Only relied on inheritance; verify `pnpm changeset status` lists it

## Workflow follow-up

- Archive the change after review and release.
