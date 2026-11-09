# Content Security Policy

> [!CAUTION]
> Experimental — not for production.
> Managed Data Mode SSR is available for evaluation and testing.
> Do not use it in production yet.
> The API and behaviour may change.
> Until then, continue using [Webpack SSR](./webpack-ssr.md).

A Content Security Policy (CSP) tells the browser which scripts and other resources it may load.
For Managed Data Mode SSR, sku sends CSP as **HTTP headers** (`Content-Security-Policy` / `Content-Security-Policy-Report-Only`).
sku does not use meta `http-equiv` CSP.

## Enable CSP

```ts
// sku.config.ts
import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  buildType: 'ssr',
  publicPath: '/',
  csp: { enforced: true },
} satisfies SkuConfig;
```

SSR requires a relative `publicPath`.

See [SSR policies](../csp.md#ssr-policies) for the report-only policy, extra sources and reporting.
The flat `csp*` options, such as `cspEnabled`, are not supported for SSR.

## Nonces

A nonce is a one-time token that lets a specific inline script run under CSP.
Request a nonce only when you need it for inline scripts or third-party tags:

- `getCspNonce()` from `sku/runtime` (app code, including loaders)
- `req.getCspNonce()` in server-entry [middleware](./middleware.md)

sku mints at most one nonce per HTML response.

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

Streaming data transports that inject `<script>` tags via [`useInsertHtml`](./runtime-api.md#useinserthtml) (for example Apollo) must put that nonce on the injected scripts.
Their bodies are not known when sku derives headers from the shell.

See [Apollo streaming hydration](./data-loading.md#apollo-streaming-hydration).

## See also

- [CSP](../csp.md#ssr-policies) — the `csp` option, extra sources and reporting
- [Runtime API](./runtime-api.md#getcspnonce) — `getCspNonce`
- [Data loading](./data-loading.md#apollo-streaming-hydration) — nonce on Apollo scripts
- [Middleware](./middleware.md) — `req.getCspNonce()`
