# Proposal

## Why

The Managed Data Mode SSR CSP hard-codes every directive except `script-src` to `'self'`-based values, and sku provides no way to extend them.
This blocks common needs such as posting Datadog RUM batches, loading images from a CDN, or embedding a third-party frame, so apps fall back to proxies or rewrite sku's header.

## What Changes

- Add a `cspExtraSources` config option for Managed Data Mode SSR apps: a map from CSP directive name to extra sources appended to that directive.
  Example: `cspExtraSources: { 'connect-src': ['https://browser-intake-datadoghq.com'] }`.
- Add `cspReportOnlyExtraSources`, defaulting to `cspExtraSources`, for the Report-Only policy.
- `script-src` is one of the map's keys, so SSR apps extend every directive through the same option.
- When a supported directive that sku does not currently emit is configured (for example `frame-src`), sku emits it as `'self'` plus the extras.
- Config validation rejects unsupported directive names, quoted keyword/nonce/hash sources, and bare `*`.
- **BREAKING (experimental SSR only):** `cspExtraScriptSrcHosts` and `cspReportOnlyExtraScriptSrcHosts` become a config error for Managed Data Mode SSR apps. They migrate to `cspExtraSources['script-src']` and `cspReportOnlyExtraSources['script-src']`.
- `cspExtraSources` and `cspReportOnlyExtraSources` are a config error for static Vite and webpack apps. Those apps keep using `cspExtraScriptSrcHosts` unchanged.

## Non-goals

- Changing the CSP emitted by static Vite or webpack apps, which only contain `script-src`.
- Extending `default-src`, `base-uri` or `frame-ancestors`.
- Changing sku's default directive values, including `frame-ancestors 'none'` and dev-only `ws: wss:`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `csp`: SSR CSP directives become extensible per directive through one config map for both policies, and the script-only host options no longer apply to SSR.

## Impact

- Public config API: two new options, and the script-host options are now limited to non-SSR build types.
- Code: config types, schema, defaults and validation, the Vite SSR CSP builder, and the plumbing that passes CSP options to the dev, production and SSR servers.
- Fixtures: `fixtures/ssr-document` migrates to `cspExtraSources`.
- Docs: `site/docs/csp.md` and `site/docs/configuration.md`.
- Changeset: `minor` for `sku`, calling out the migration for experimental SSR apps.
