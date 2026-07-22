## ADDED Requirements

### Requirement: Vite SSR CSP is delivered as HTTP headers

When CSP is enabled for a Vite SSR app, sku MUST set Content Security Policy via HTTP response headers, not HTML `http-equiv` meta tags.

#### Scenario: Enforcing CSP header on HTML responses

- **WHEN** CSP is enabled and sku begins streaming an HTML document response
- **THEN** the response includes a `Content-Security-Policy` header before the body is sent

#### Scenario: No meta http-equiv CSP

- **WHEN** CSP is enabled for a Vite SSR app
- **THEN** sku MUST NOT inject a `Content-Security-Policy` meta `http-equiv` tag as the policy delivery mechanism

### Requirement: CSP is derived from shell HTML plus dynamic values

sku MUST generate the Vite SSR CSP from the rendered document shell (known script tags and origins).

Sku MUST allow dynamic values such as nonces and hashes of known bootstrap script bodies.

#### Scenario: Shell scripts are allowed

- **WHEN** the document shell includes sku bootstrap or other shell script tags
- **THEN** those scripts are permitted by the generated `script-src` policy

#### Scenario: Hashable bootstrap script bodies

- **WHEN** CSP is enabled and sku emits known inline bootstrap script content
- **THEN** those exact script bodies are available for hashing into the CSP policy

### Requirement: Vite SSR uses at most one CSP nonce per render, only when requested

For a Vite SSR HTML response, sku MUST generate at most one CSP nonce, only when explicitly requested (by consumer code or by sku when attaching a `nonce` to scripts).

When requested, sku MUST reuse that same value everywhere for the response.

Sku MUST NOT provide a Vite SSR API that creates additional distinct nonces for the same response (unlike static/webpack `createUnsafeNonce`).

Sku MUST include `'nonce-…'` in the CSP header only if a nonce was requested.

If CSP is enabled but nothing requested a nonce, the CSP header MUST still be emitted without a nonce allowance.

#### Scenario: Nonce omitted from CSP when never requested

- **WHEN** CSP is enabled for a Vite SSR HTML response
- **AND** neither consumer code nor sku requested a nonce during that request
- **THEN** the CSP header does not include a `'nonce-…'` source

#### Scenario: Requested nonce appears once in CSP and is reused

- **WHEN** a nonce is requested during a Vite SSR render
- **THEN** sku generates exactly one nonce for that request
- **AND** the CSP header includes that nonce
- **AND** every subsequent request for the nonce on that response returns the same value
- **AND** sku-owned nonce-bearing scripts for that response use that same value

#### Scenario: Consumer requests the shared nonce

- **WHEN** consumer middleware or loaders explicitly request the Vite SSR CSP nonce during a request
- **THEN** they receive the request nonce
- **AND** that nonce matches the nonce used in the CSP header and React stream for that response (when the header includes a nonce)

#### Scenario: No multi-nonce factory on Vite SSR

- **WHEN** a Vite SSR app needs CSP nonces
- **THEN** consumers MUST NOT use webpack/static `createUnsafeNonce` as the Vite SSR API
- **AND** sku MUST NOT expose a Vite SSR helper that returns a new distinct nonce on each call for the same response

### Requirement: Report-Only CSP may coexist with an enforcing policy and MUST support report-to

Vite SSR apps MUST support a Report-Only CSP that can be set in addition to an enforcing CSP.

When Report-Only is enabled, consumers MUST be able to configure a `report-to` value, and sku MUST include that value in the Report-Only policy.

#### Scenario: Report-Only header alongside enforcing policy

- **WHEN** both enforcing CSP and Report-Only CSP are enabled
- **THEN** the response includes both `Content-Security-Policy` and `Content-Security-Policy-Report-Only` headers

#### Scenario: Report-Only only

- **WHEN** only Report-Only CSP is enabled
- **THEN** the response includes `Content-Security-Policy-Report-Only` and does not require an enforcing `Content-Security-Policy` header

#### Scenario: Configurable report-to on Report-Only policy

- **WHEN** Report-Only CSP is enabled and a `report-to` value is configured
- **THEN** the `Content-Security-Policy-Report-Only` header includes a `report-to` directive using that configured value

### Requirement: Vite SSR CSP assumes relative publicPath only

Vite SSR CSP MUST assume a relative `publicPath` so Document assets are covered by `'self'`.

Absolute `http(s)` / CDN `publicPath` is not supported.

Consumer `cspExtraScriptSrcHosts` remains for third-party script hosts.

#### Scenario: Relative publicPath with CSP enabled

- **WHEN** CSP is enabled and `publicPath` is a relative path
- **AND** sku streams an HTML document whose assets use that relative path
- **THEN** the CSP header allows those assets via `'self'` (and nonces/hashes as applicable)
- **AND** sku does not require an absolute/`CDN` origin allowance for sku-owned Document assets

### Requirement: Webpack SSR and static CSP behavior are unchanged by this capability

This Vite SSR CSP capability MUST NOT change CSP delivery for webpack SSR apps or static apps.

Static Vite may independently support `cspDelivery` (`tag` / `header` metadata) and Report-Only via the static HTML CSP path; those options MUST NOT control Vite SSR CSP (Vite SSR always uses HTTP headers and its own Report-Only / `report-to` config).

Static and webpack apps MAY continue to allow multiple `createUnsafeNonce` calls per render.

#### Scenario: Static app CSP unchanged by Vite SSR path

- **WHEN** a static app has CSP enabled
- **THEN** its existing static CSP behavior remains as for that app mode (meta tag and/or metadata / start headers as configured)
- **AND** Vite SSR does not rewrite that static delivery model

#### Scenario: Static multi-nonce API unchanged

- **WHEN** a static or webpack render calls `createUnsafeNonce` more than once
- **THEN** existing multi-nonce behavior remains as today

#### Scenario: cspDelivery does not apply to Vite SSR

- **WHEN** a Vite SSR app sets `cspDelivery`
- **THEN** sku ignores that option for Vite SSR responses
- **AND** CSP is still delivered as HTTP headers (not meta `http-equiv`)
