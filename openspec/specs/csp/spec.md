# CSP

## Purpose

How sku delivers Content Security Policy for SSR document responses.
SSR always uses HTTP headers, not HTML meta tags.
The policy is derived from the document shell plus dynamic nonces and hashes.

## Requirements

### Requirement: SSR CSP is delivered as HTTP headers

When CSP is enabled for an SSR app, sku MUST set Content Security Policy via HTTP response headers, not HTML `http-equiv` meta tags.

#### Scenario: Enforcing CSP header on HTML responses

- **WHEN** CSP is enabled and sku begins streaming an HTML document response
- **THEN** the response includes a `Content-Security-Policy` header before the body is sent

#### Scenario: No meta http-equiv CSP

- **WHEN** CSP is enabled for an SSR app
- **THEN** sku MUST NOT inject a `Content-Security-Policy` meta `http-equiv` tag as the policy delivery mechanism

### Requirement: CSP is derived from shell HTML plus dynamic values

sku MUST generate the SSR CSP from the rendered document shell (known script tags and origins).

Sku MUST allow dynamic values such as nonces and hashes of known bootstrap script bodies.

#### Scenario: Shell scripts are allowed

- **WHEN** the document shell includes sku bootstrap or other shell script tags
- **THEN** those scripts are permitted by the generated `script-src` policy

#### Scenario: Hashable bootstrap script bodies

- **WHEN** CSP is enabled and sku emits known inline bootstrap script content
- **THEN** those exact script bodies are available for hashing into the CSP policy

### Requirement: SSR uses at most one CSP nonce per render, only when requested

For an SSR HTML response, sku MUST generate at most one CSP nonce, only when explicitly requested (by consumer code or by sku when attaching a `nonce` to scripts).

When requested, sku MUST reuse that same value everywhere for the response.

Sku MUST expose that request via `getCspNonce` from `sku/runtime`.

Sku MUST NOT provide an SSR API that creates additional distinct nonces for the same response (unlike static/webpack `createUnsafeNonce`).

Sku MUST include `'nonce-…'` in the CSP header only if a nonce was requested.

If CSP is enabled but nothing requested a nonce, the CSP header MUST still be emitted without a nonce allowance.

#### Scenario: Nonce omitted from CSP when never requested

- **WHEN** CSP is enabled for an SSR HTML response
- **AND** neither consumer code nor sku requested a nonce during that request
- **THEN** the CSP header does not include a `'nonce-…'` source

#### Scenario: Requested nonce appears once in CSP and is reused

- **WHEN** a nonce is requested during an SSR render
- **THEN** sku generates exactly one nonce for that request
- **AND** the CSP header includes that nonce
- **AND** every subsequent request for the nonce on that response returns the same value
- **AND** sku-owned nonce-bearing scripts for that response use that same value

#### Scenario: Consumer requests the shared nonce

- **WHEN** consumer middleware or loaders explicitly request the SSR CSP nonce via `getCspNonce` from `sku/runtime` during a request
- **THEN** they receive the request nonce
- **AND** that nonce matches the nonce used in the CSP header and React stream for that response (when the header includes a nonce)

#### Scenario: No multi-nonce factory on SSR

- **WHEN** an SSR app needs CSP nonces
- **THEN** consumers MUST NOT use webpack/static `createUnsafeNonce` as the SSR API
- **AND** sku MUST NOT expose an SSR helper that returns a new distinct nonce on each call for the same response

#### Scenario: Injected scripts can carry the CSP nonce

- **WHEN** an app injects a `<script>` carrying the nonce from `getCspNonce()` (imported from `sku/runtime`) via `useInsertHtml`
- **THEN** the response `script-src` includes that `'nonce-…'`
- **AND** the script is not required to be hashable at header-derivation time

### Requirement: Report-Only CSP may coexist with an enforcing policy

SSR apps MUST support a Report-Only CSP that can be set in addition to an enforcing CSP.

#### Scenario: Report-Only header alongside enforcing policy

- **WHEN** both enforcing CSP and Report-Only CSP are enabled
- **THEN** the response includes both `Content-Security-Policy` and `Content-Security-Policy-Report-Only` headers

#### Scenario: Report-Only only

- **WHEN** only Report-Only CSP is enabled
- **THEN** the response includes `Content-Security-Policy-Report-Only` and does not require an enforcing `Content-Security-Policy` header

### Requirement: SSR report-to matches static Vite semantics

SSR MUST accept `cspReportTo` and `cspReportOnlyReportTo` in the same forms static Vite accepts: an endpoint name, a URL, or a tuple of both.
`cspReportOnlyReportTo` MUST default to `cspReportTo`.

Sku MUST include the resolved endpoint name as the `report-to` directive of the corresponding policy, and MUST emit a `Reporting-Endpoints` response header covering every resolved endpoint that carries a URL.

Because SSR ignores `cspDelivery` and always uses HTTP headers, `cspReportTo` MUST apply whenever CSP is enabled, rather than being gated on `header` delivery.

#### Scenario: Configurable report-to on either policy

- **WHEN** a `report-to` value is configured for the enforcing and/or Report-Only policy
- **THEN** the corresponding `Content-Security-Policy` and/or `Content-Security-Policy-Report-Only` header includes a `report-to` directive using the resolved endpoint name

#### Scenario: Reporting-Endpoints emitted for URL-bearing endpoints

- **WHEN** a configured `report-to` value resolves to an endpoint that carries a URL
- **THEN** the response includes a `Reporting-Endpoints` header mapping that endpoint name to its URL

#### Scenario: No Reporting-Endpoints header without URLs

- **WHEN** every configured `report-to` value is an endpoint name only
- **THEN** sku MUST NOT emit a `Reporting-Endpoints` header, leaving the endpoint group for the app or its infrastructure to define

### Requirement: SSR CSP assumes relative publicPath only

SSR CSP MUST assume a relative `publicPath` so Document assets are covered by `'self'`.

Absolute `http(s)` / CDN `publicPath` is not supported.

Consumer `cspExtraScriptSrcHosts` remains for third-party script hosts.

#### Scenario: Relative publicPath with CSP enabled

- **WHEN** CSP is enabled and `publicPath` is a relative path
- **AND** sku streams an HTML document whose assets use that relative path
- **THEN** the CSP header allows those assets via `'self'` (and nonces/hashes as applicable)
- **AND** sku does not require an absolute/`CDN` origin allowance for sku-owned Document assets

### Requirement: SSR ignores cspDelivery

`cspDelivery` MUST NOT control SSR CSP.
SSR MUST always deliver CSP via HTTP headers when CSP is enabled.

This capability MUST NOT redefine CSP delivery for static or webpack apps.

#### Scenario: cspDelivery does not apply to SSR

- **WHEN** an SSR app sets `cspDelivery`
- **THEN** sku ignores that option for SSR responses
- **AND** CSP is still delivered as HTTP headers (not meta `http-equiv`)
