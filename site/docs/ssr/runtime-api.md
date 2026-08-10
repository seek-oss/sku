# Runtime API

:::danger Experimental — not for production
Managed Data Mode SSR is available for evaluation and testing. Do not use it in production yet; the API and behaviour may change.
In the meantime, continue using [Webpack SSR](./webpack-ssr.md).
:::

Import browser-safe Managed Data Mode helpers from `sku/runtime`.
Most helpers are documented on the topic pages that use them; this page indexes those exports and documents `useInsertHtml` and `getCspNonce`.

| Export                                                                   | Use for                                                  |
| ------------------------------------------------------------------------ | -------------------------------------------------------- |
| [`defineServerEntry` / `defineClientEntry`](./entries.md)                | Typed server and client entry objects                    |
| [`createSkuContexts`](./providers.md#typed-hooks)                        | Typed `useSite` / `useClientContext` / `useReactContext` |
| [`usePreloadRoute`](./routing.md#intent-preloading-with-usepreloadroute) | Warm lazy route chunks on intent                         |
| [`useInsertHtml`](#useinserthtml)                                        | Queue React nodes into the SSR response stream           |
| [`getCspNonce`](#getcspnonce)                                            | Request a CSP nonce for inline / injected scripts        |

## `useInsertHtml`

Returns `(callback: () => ReactNode) => void`.

During document SSR, sku writes queued nodes into the response stream (first batch before `</head>`, then before later React chunks).
In the browser it is a silent no-op.

Use it for streaming data transports such as Apollo’s `buildManualDataTransport` — see [Apollo streaming hydration](./data-loading.md#apollo-streaming-hydration).

Injected script bodies carry the [CSP nonce](./csp.md#nonces) if enabled.

## `getCspNonce`

Returns the request-scoped CSP nonce, minting one on first read.
Call it only when you need a nonce for inline or injected scripts (for example Apollo `extraScriptProps`).
In the browser it returns an empty string so isomorphic code can call it safely.

Express middleware can use `req.getCspNonce()` instead — same store for the response.
See [CSP](./csp.md#nonces).

## See also

- [Request entries](./entries.md) — `defineServerEntry` / `defineClientEntry`
- [Providers](./providers.md) — `createSkuContexts`
- [Routing](./routing.md#intent-preloading-with-usepreloadroute) — `usePreloadRoute`
- [Data loading](./data-loading.md#apollo-streaming-hydration) — Apollo + `useInsertHtml`
- [CSP](./csp.md) — headers and nonces
