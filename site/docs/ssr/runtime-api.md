# Runtime API

:::danger Experimental — not for production
Managed Data Mode SSR is available for evaluation and testing. Do not use it in production yet; the API and behaviour may change.
In the meantime, continue using [Webpack SSR](./webpack-ssr.md).
:::

The sku runtime API, imported by `sku/runtime`, is used for browser-safe runtime concerns for Managed Data Mode.

- [`defineServerEntry` / `defineClientEntry`](./providers.md#entry-helpers-and-typing) — entry typing helpers
- [`createSkuSsrContexts`](./providers.md#typed-hooks) — typed `useSite` / `useClientContext` / `useReactContext`
- [`usePreloadRoute`](./routing.md#intent-preloading-with-usepreloadroute) — warm lazy route chunks on intent
- [`useInsertHtml`](#useinserthtml) — queue React nodes into the SSR response stream
- `getCspNonce` — also available from the main `sku` entry for backwards compatibility

## `useInsertHtml`

Returns `(callback: () => ReactNode) => void`.
During document SSR, sku writes queued nodes into the response stream (first batch before `</head>`, then before later React chunks).
In the browser it is a silent no-op.

Use it for streaming data transports such as Apollo’s `buildManualDataTransport` — see [Apollo streaming hydration](./data-loading.md#apollo-streaming-hydration).

Injected script bodies carry the [CSP nonce](./csp.md) if enabled.
