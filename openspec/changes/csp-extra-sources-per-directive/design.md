# Design

## Context

The SSR policy is built in `packages/sku/src/services/vite/ssr/csp.ts` (`buildContentSecurityPolicy`) from a fixed directive list.
Only `script-src` takes extras, threaded as `extraHosts` / `reportOnlyExtraHosts` from `createSkuContext` through `ssr.ts`, `createDevSsrServer`, `startProductionSsrServer`, `listen` and `createHtmlRenderMiddleware`.
Static Vite and webpack use the separate handler in `services/webpack/entry/csp.ts`, which only emits `script-src` and `report-to`.
`validateConfig.ts` already rejects several options for SSR apps (for example `serverPort` and `vitePlugins`) by checking the consumer's own config.
CSP is configured through flat options (`cspEnabled`, `cspReportOnlyEnabled`, `cspReportTo`, `cspReportOnlyReportTo` and so on), with an enforced and a report-only key for every setting.

## Goals / Non-Goals

**Goals:**

- One `csp` option that holds both SSR policies and covers every source-list directive they realistically need.
- A shape that static apps can adopt later without changing it.
- Each build type has exactly one way to configure its CSP.

**Non-Goals:**

- A transform hook or full policy override.
- Unifying the static and SSR CSP builders.
- Moving static Vite and webpack apps to `csp` in this change.

## Decisions

**One `csp` option with peer policies.**

```ts
export default {
  bundler: 'vite',
  buildType: 'ssr',
  csp: {
    enforced: {
      extraSources: {
        'connect-src': ['https://browser-intake-datadoghq.com'],
      },
      reportTo: 'https://csp.example.com/report',
    },
    reportOnly: {
      extraSources: {
        'script-src': ['https://new-tag.example.com'],
      },
      reportTo: 'https://csp.example.com/report',
    },
  },
} satisfies SkuConfig;
```

Each policy is `true` (sku's policy with nothing extra) or an object, and leaving one out turns it off.
Flat options need a pair of keys for every setting, which produces names like `cspReportOnlyExtraSources`.
The two policies are peers because each can be on without the other.
`enforced` and `reportOnly` follow the CSP spec, where each policy's disposition is either "enforce" or "report", and the `Content-Security-Policy-Report-Only` header.
SvelteKit uses the same structure, with `csp.directives` and `csp.reportOnly` as peers.
Astro's `scriptDirective` and `styleDirective` objects were not followed, because they configure hashing and `strict-dynamic`, which sku owns.

**No inheritance between the policies.**
The flat `cspReportOnly*` options default to their enforced values.
Between peers, a hidden default is surprising, especially when only Report-Only is on.
Apps that want the same values share a constant.

**`reportTo` is a URL only, and sku names the endpoints.**
The endpoint name only links a policy's `report-to` directive to its `Reporting-Endpoints` entry, and browsers don't send it to the collector.
SEEK's collector tells apps apart by URL path, and each report carries its policy's disposition.
The flat options also accept an endpoint name alone, for endpoints declared outside sku, but no SEEK app does that.
sku names the enforced endpoint `csp` and the Report-Only endpoint `csp-report-only`, so both policies can report to different URLs without a name clash.

**No `delivery` key.**
SSR always uses headers, and `tag` delivery is being removed in an upcoming major.

**Map keyed by full directive name** (`{ 'connect-src': [...] }`), not short keys (`connect`) or one option per directive.
Full names match the header and MDN docs, so they are easy to search and copy. A map stops the config surface growing one option per directive.

**Split the options by build type, and make the wrong option a config error.**
SSR apps use `csp`, and static and webpack apps use the flat options.
The alternative was to keep the flat options working for SSR and deprecate them. That leaves two ways to set the same policy.
Errors follow the existing "SSR does not support X" pattern and name the replacement key.
Breaking SSR configs is acceptable because SSR is experimental, and each flat option maps to one `csp` key.

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

**Plumbing:** `buildContentSecurityPolicy` / `buildCspHeaders` take `extraSources: Partial<Record<Directive, string[]>>` and `reportOnlyExtraSources` in place of the script-host arrays.
`createSkuContext` resolves `csp` into the existing context fields: `cspEnabled` and `cspReportOnlyEnabled`, `cspExtraSources` and `cspReportOnlyExtraSources`, and `cspReportTo` and `cspReportOnlyReportTo` as `{ endpoint: 'csp', url }` and `{ endpoint: 'csp-report-only', url }`.
The SSR server plumbing keeps those fields. The static and webpack paths are unchanged.

## Follow-up: static apps

Static Vite apps can take the same `csp` shape, with `extraSources` limited to `script-src`.
Using `csp` means header delivery.
Their flat options would be deprecated and removed in the major that removes `tag` delivery, so they break once.
Webpack apps have no header delivery, so how they fit is still open.

## Risks / Trade-offs

- [Every allowed host is a destination that injected scripts could send data to] → The docs say to allow specific origins and explain the `connect-src` trade-off.
- [Existing SSR apps fail validation after upgrading, for any flat CSP option] → Each error names the replacement `csp` key, and the changeset includes a migration table.
- [Apps relying on Report-Only inheriting the enforced values lose them silently if they only rename keys] → The changeset says to set values on both policies, and shows a shared constant.
- [The supported directive list may need to grow, for example to `object-src`] → Adding a key is a minor, non-breaking change.
- [`'self'` added to emitted directives surprises users who wanted a cross-origin-only directive] → This matches the existing `default-src 'self'` fallback, and the docs state it.
