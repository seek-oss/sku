# Content Security Policy

:::danger Experimental — not for production
Managed Data Mode SSR is available for evaluation and testing. Do not use it in production yet; the API and behaviour may change.
In the meantime, continue using [Webpack SSR](./webpack-ssr.md).
:::

When `cspEnabled` and/or `cspReportOnlyEnabled` are set, SSR delivers CSP as **HTTP headers** (`Content-Security-Policy` / `Content-Security-Policy-Report-Only`).
Meta `http-equiv` CSP is not used on the SSR path.

See [CSP](../csp.md) and [Configuration](../configuration.md) for report-only options and extra script hosts.
`cspReportTo` and `cspReportOnlyReportTo` behave as documented there, with any generated `Reporting-Endpoints` sent as a response header.
SSR requires a relative `publicPath`.

## Nonces

Request a nonce only when you need it for inline scripts or third-party tags:

- `getCspNonce()` from `sku/runtime` (app code)
- `req.getCspNonce()` in server-entry [middleware](./middleware.md)

At most one nonce is minted per HTML response.

Streaming data transports that inject `<script>` tags via [`useInsertHtml`](./runtime-api.md#useinserthtml) (for example Apollo) must put that nonce on the injected scripts — their bodies are not known when headers are derived from the shell.

See [Apollo streaming hydration](./data-loading.md#apollo-streaming-hydration).
