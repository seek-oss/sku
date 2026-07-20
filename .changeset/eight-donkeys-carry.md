---
'sku': minor
---

`csp`: Add `cspDelivery` config option.

A new configuration option, `cspDelivery`, allows control of how the Content Security Policy is delivered and can be set to one of two values:

- `tag`: The CSP is embedded directly in the rendered HTML content via a `<meta http-equiv="Content-Security-Policy" …>` tag. This is the default and matches the previous behaviour.
- `header`: The CSP is written to a JSON metadata file alongside the rendered HTML content. This metadata can be used at deployment and/or request time to include a `Content-Security-Policy` header in the response for the rendered HTML content.

See the [Content Security Policy](https://seek-oss.github.io/sku/docs/csp#delivery) section of the sku docs for more details.
