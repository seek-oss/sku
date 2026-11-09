# Proposal

## Why

The Managed Data Mode SSR CSP hard-codes every directive except `script-src` to `'self'`-based values, and sku provides no way to extend them.
This blocks common needs such as posting Datadog RUM batches, loading images from a CDN, or embedding a third-party frame, so apps fall back to proxies or rewrite sku's header.
The flat `csp*` options also need an enforced and a report-only key for every setting, so each new setting adds two long option names.

## What Changes

- SSR apps configure CSP through one `csp` option with two peer policies, `enforced` and `reportOnly`.
  Each policy is `true` or `{ extraSources, reportTo }`, and the two policies don't inherit from each other.
  Example: `csp: { enforced: { extraSources: { 'connect-src': ['https://browser-intake-datadoghq.com'] } } }`.
- `extraSources` is a map from CSP directive name to extra sources appended to that directive.
  `script-src` is one of the map's keys, so SSR apps extend every directive the same way.
- When a supported directive that sku does not currently emit is configured (for example `frame-src`), sku emits it as `'self'` plus the extras.
- Config validation rejects unsupported directive names, quoted keyword/nonce/hash sources, bare `*`, and scheme-only sources in `script-src`.
- `reportTo` is a URL. sku names the endpoints `csp` and `csp-report-only`.
- **BREAKING (experimental SSR only):** every flat CSP option is a config error for Managed Data Mode SSR apps: `cspEnabled`, `cspExtraScriptSrcHosts`, `cspReportOnlyEnabled`, `cspReportOnlyExtraScriptSrcHosts`, `cspReportTo`, `cspReportOnlyReportTo` and `cspDelivery` (which SSR previously ignored).
  Each error names the `csp` key that replaces it.
- `csp` is a config error for static Vite and webpack apps. Those apps keep their flat options unchanged.

## Non-goals

- Changing the CSP emitted by static Vite or webpack apps, which only contain `script-src`.
- Moving static Vite and webpack apps to `csp`. That is a follow-up, described in the design.
- Extending `default-src`, `base-uri` or `frame-ancestors`.
- Changing sku's default directive values, including `frame-ancestors 'none'` and dev-only `ws: wss:`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `csp`: SSR CSP is configured through one `csp` option with peer enforced and Report-Only policies, each extensible per directive and reporting to a URL. The flat CSP options no longer apply to SSR.

## Impact

- Public config API: one new option, `csp`, and the flat CSP options are now limited to non-SSR build types.
- Code: config types, schema, defaults and validation, the context that resolves `csp`, the Vite SSR CSP builder, and the plumbing that passes CSP options to the dev, production and SSR servers.
- Fixtures: `fixtures/ssr-document` migrates to `csp`.
- Docs: `site/docs/csp.md` and `site/docs/configuration.md`.
- Changeset: `minor` for `sku`, with a migration table for experimental SSR apps.
