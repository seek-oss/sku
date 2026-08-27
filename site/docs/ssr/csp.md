# Content Security Policy

> [!CAUTION]
> Experimental — not for production.
> Managed Data Mode SSR is available for evaluation and testing. Do not use it in production yet; the API and behaviour may change.
> In the meantime, continue using [Webpack SSR](./webpack-ssr.md).

For Managed Data Mode SSR, Content Security Policy is delivered as **HTTP headers** (`Content-Security-Policy` / `Content-Security-Policy-Report-Only`).
Meta `http-equiv` CSP is not used.

## Enable CSP

```ts
// sku.config.ts
import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  buildType: 'ssr',
  publicPath: '/',
  cspEnabled: true,
} satisfies SkuConfig;
```

SSR requires a relative `publicPath`.

See [CSP](../csp.md) and [Configuration](../configuration.md) for report-only options and extra script hosts.
`cspReportTo` and `cspReportOnlyReportTo` behave as documented there, with any generated `Reporting-Endpoints` sent as a response header.

## Nonces

Request a nonce only when you need it for inline scripts or third-party tags:

- `getCspNonce()` from `sku/runtime` (app code, including loaders)
- `req.getCspNonce()` in server-entry [middleware](./middleware.md)

At most one nonce is minted per HTML response.

```tsx
import { defineServerEntry, getCspNonce } from 'sku/runtime';

const server = defineServerEntry({
  getReactContext() {
    return {
      extraScriptProps: { nonce: getCspNonce() },
    };
  },
});

export default server;
```

Streaming data transports that inject `<script>` tags via [`useInsertHtml`](./runtime-api.md#useinserthtml) (for example Apollo) must put that nonce on the injected scripts — their bodies are not known when headers are derived from the shell.

See [Apollo streaming hydration](./data-loading.md#apollo-streaming-hydration).

## See also

- [CSP](../csp.md) — shared CSP options and report-to behaviour
- [Runtime API](./runtime-api.md#getcspnonce) — `getCspNonce`
- [Data loading](./data-loading.md#apollo-streaming-hydration) — nonce on Apollo scripts
- [Middleware](./middleware.md) — `req.getCspNonce()`
