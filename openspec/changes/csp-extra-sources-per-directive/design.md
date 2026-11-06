# Design

## Context

The SSR policy is built in `packages/sku/src/services/vite/ssr/csp.ts` (`buildContentSecurityPolicy`) from a fixed directive list.
Only `script-src` takes extras, threaded as `extraHosts` / `reportOnlyExtraHosts` from `createSkuContext` through `ssr.ts`, `createDevSsrServer`, `startProductionSsrServer`, `listen` and `createHtmlRenderMiddleware`.
Static Vite and webpack use the separate handler in `services/webpack/entry/csp.ts`, which only emits `script-src` and `report-to`.
`validateConfig.ts` already rejects several options for SSR apps (for example `serverPort` and `vitePlugins`) by checking the consumer's own config.

## Goals / Non-Goals

**Goals:**

- One option shape for SSR apps that covers every source-list directive they realistically need.
- Each build type has exactly one way to extend its CSP.

**Non-Goals:**

- A transform hook or full policy override.
- Unifying the static and SSR CSP builders.

## Decisions

**Map keyed by full directive name** (`{ 'connect-src': [...] }`), not short keys (`connect`) or one option per directive.
Full names match the header and MDN docs, so they are easy to search and copy. A map stops the config surface growing one option per directive.

**Split the options by build type, and make the wrong option a config error.**
SSR apps use `cspExtraSources`, and static and webpack apps use `cspExtraScriptSrcHosts`.
The alternative was to keep `cspExtraScriptSrcHosts` working for SSR, merged into `script-src`, and deprecate it. That leaves two ways to set the same directive.
Static policies only contain `script-src`, so a map there would offer keys that do nothing.
Errors follow the existing "SSR does not support X" pattern and name the replacement.
Breaking SSR configs is acceptable because SSR is experimental, and the migration is a one-line move.

**Exclude `default-src`, `base-uri` and `frame-ancestors`.**
Extending `default-src` silently widens every directive that falls back to it.
`frame-ancestors 'none'` cannot have sources appended. Allowing framing needs a decision about replacing `'none'`, which is out of scope.

**Reject quoted sources and bare `*`.**
The option is for allowing origins. Keywords, nonces and hashes would let apps weaken the policy in ways sku can't reason about, and sku already manages its own `script-src` nonces and hashes. A bare `*` turns the directive into an open allowance.
Schemes (`https:`, `data:`, `blob:`) and wildcard hosts (`https://*.example.com`) stay allowed, because they have legitimate uses.

**Reject schemes in `script-src`.**
sku's policy doesn't use `'strict-dynamic'`, so a scheme such as `https:` in `script-src` allows scripts from any origin using it and cancels the protection of sku's nonces and hashes, the same as a bare `*`. Workers that need `blob:` use `worker-src`, which still accepts schemes.

**Missing directives are emitted as `'self'` plus the extras.**
Without an explicit directive the browser falls back to `default-src 'self'`, so `'self'` keeps same-origin behaviour unchanged when an app adds a cross-origin source.

**Plumbing:** replace `extraHosts: string[]` on `buildContentSecurityPolicy` / `buildCspHeaders` with `extraSources: Partial<Record<Directive, string[]>>`, and `reportOnlyExtraHosts` with `reportOnlyExtraSources`. The SSR server options carry `cspExtraSources` / `cspReportOnlyExtraSources` in place of the script-host fields. The static and webpack paths are unchanged.

## Risks / Trade-offs

- [Every allowed host is a destination that injected scripts could send data to] → The docs say to allow specific origins and explain the `connect-src` trade-off.
- [Existing SSR apps fail validation after upgrading] → The error names the exact replacement, and the changeset includes a before/after example.
- [The supported directive list may need to grow, for example to `object-src`] → Adding a key is a minor, non-breaking change.
- [`'self'` added to emitted directives surprises users who wanted a cross-origin-only directive] → This matches the existing `default-src 'self'` fallback, and the docs state it.
