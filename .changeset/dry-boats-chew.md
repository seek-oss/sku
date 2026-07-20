---
'sku': minor
---

`csp`: Add support for report-only Content Security Policy.

Two new configuration options, `cspReportOnlyEnabled` and `cspReportOnlyExtraScriptSrcHosts`, allow the generation of a "report-only" CSP delivered via the `Content-Security-Policy-Report-Only` header.

See the [Content Security Policy](https://seek-oss.github.io/sku/docs/csp#report-only-content-security-policy) section of the sku docs for more details.
