# Content Security Policy

When `cspEnabled` and/or `cspReportOnlyEnabled` are set, SSR delivers CSP as **HTTP headers** (`Content-Security-Policy` / `Content-Security-Policy-Report-Only`) derived from the document shell plus nonces and hashes of bootstrap scripts.
Meta `http-equiv` CSP is **not** used on the SSR path.

SSR uses **at most one** request-scoped nonce per HTML response, minted only when explicitly requested (`getCspNonce()` from `sku`, or `req.getCspNonce()` in middleware).

Relative `publicPath` only — see [CSP](../csp.md) and [Configuration](../configuration.md) for report-only options (`cspReportOnlyReportTo`, extra script hosts, etc.).

## Delivery

CSP for SSR is applied as response headers on the streamed HTML document, not as a `<meta http-equiv>` tag.
Sku owns composing those headers from the Document shell and any nonces/hashes required for bootstrap scripts.

## Nonces

Request a nonce only when you need it for inline scripts or third-party tags that participate in the CSP:

- `getCspNonce()` from `sku` (app code)
- `req.getCspNonce()` in server-entry [middleware](./middleware.md)

At most one nonce is minted per HTML response.

Streaming data transports that inject `<script>` tags via [`useInsertHtml`](./entries.md#useinserthtml) (for example Apollo’s manual data transport) must put that nonce on the injected scripts — their bodies are not known when headers are derived from the shell, so they cannot be hashed.
Pass `extraScriptProps={{ nonce: getCspNonce() }}` on the **server** entry’s provider only; see [Apollo streaming hydration](./data-loading.md#apollo-streaming-hydration).
