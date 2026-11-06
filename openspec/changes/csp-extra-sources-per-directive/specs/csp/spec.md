# Spec Delta

## ADDED Requirements

### Requirement: SSR CSP directives are extensible per directive

For SSR apps, sku MUST append the sources configured in `cspExtraSources` to the matching directive of the enforcing CSP, and those in `cspReportOnlyExtraSources` (defaulting to `cspExtraSources`) to the Report-Only CSP.

The supported directives are `script-src`, `style-src`, `img-src`, `font-src`, `connect-src`, `frame-src`, `media-src`, `worker-src`, `manifest-src` and `form-action`.
A supported directive that sku does not emit by default MUST be emitted as `'self'` followed by the configured sources.
Sku MUST keep its own sources for every directive (including `script-src` nonces and hashes), adding configured sources without duplicates.

#### Scenario: Extra connect-src host

- **WHEN** an SSR app sets `cspExtraSources: { 'connect-src': ['https://browser-intake-datadoghq.com'] }`
- **THEN** the production `Content-Security-Policy` header contains `connect-src 'self' https://browser-intake-datadoghq.com`
- **AND** in development the directive still includes `ws: wss:`

#### Scenario: Extra script-src host

- **WHEN** an SSR app sets `cspExtraSources: { 'script-src': ['https://cdn.example.com'] }`
- **THEN** the `script-src` directive includes `https://cdn.example.com` alongside sku's `'self'`, hashes and any requested nonce

#### Scenario: Directive not emitted by default

- **WHEN** an SSR app sets `cspExtraSources: { 'frame-src': ['https://www.youtube.com'] }`
- **THEN** the CSP header contains `frame-src 'self' https://www.youtube.com`

#### Scenario: Report-Only policy uses its own extras

- **WHEN** an SSR app sets both `cspExtraSources` and `cspReportOnlyExtraSources`
- **THEN** the `Content-Security-Policy` header uses `cspExtraSources`
- **AND** the `Content-Security-Policy-Report-Only` header uses `cspReportOnlyExtraSources` instead

#### Scenario: Unset options leave the policy unchanged

- **WHEN** an SSR app sets neither option
- **THEN** the CSP headers are identical to those generated without this feature

### Requirement: Invalid extra sources are rejected

Sku MUST fail config validation when `cspExtraSources` or `cspReportOnlyExtraSources` contains an unsupported directive name, a quoted source (such as `'unsafe-inline'`, a nonce or a hash), a bare `*`, or a scheme-only source (such as `https:`) under `script-src`.

#### Scenario: Unsupported directive

- **WHEN** a config sets `cspExtraSources: { 'default-src': ['https://example.com'] }`
- **THEN** sku reports a config validation error

#### Scenario: Keyword source

- **WHEN** a config sets `cspExtraSources: { 'style-src': ["'unsafe-eval'"] }`
- **THEN** sku reports a config validation error

#### Scenario: Scheme in script-src

- **WHEN** a config sets `cspExtraSources: { 'script-src': ['https:'] }`
- **THEN** sku reports a config validation error

#### Scenario: Scheme outside script-src

- **WHEN** a config sets `cspExtraSources: { 'worker-src': ['blob:'] }`
- **THEN** config validation passes

### Requirement: CSP extension options match the build type

Sku MUST fail config validation when an SSR app sets `cspExtraScriptSrcHosts` or `cspReportOnlyExtraScriptSrcHosts`, or when a static Vite or webpack app sets `cspExtraSources` or `cspReportOnlyExtraSources`.
Each error MUST name the option to use instead.

#### Scenario: SSR app sets cspExtraScriptSrcHosts

- **WHEN** an SSR app sets `cspExtraScriptSrcHosts`
- **THEN** sku reports a config validation error that points to `cspExtraSources['script-src']`

#### Scenario: Static app sets cspExtraSources

- **WHEN** a static Vite app sets `cspExtraSources`
- **THEN** sku reports a config validation error that points to `cspExtraScriptSrcHosts`

## MODIFIED Requirements

### Requirement: SSR CSP assumes relative publicPath only

SSR CSP MUST assume a relative `publicPath` so Document assets are covered by `'self'`.

Absolute `http(s)` / CDN `publicPath` is not supported.

Third-party script hosts are allowed through `cspExtraSources['script-src']`.

#### Scenario: Relative publicPath with CSP enabled

- **WHEN** CSP is enabled and `publicPath` is a relative path
- **AND** sku streams an HTML document whose assets use that relative path
- **THEN** the CSP header allows those assets via `'self'` (and nonces/hashes as applicable)
- **AND** sku does not require an absolute/`CDN` origin allowance for sku-owned Document assets
