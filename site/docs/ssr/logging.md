# Logging

:::danger Experimental — not for production
Managed Data Mode SSR is available for evaluation and testing. Do not use it in production yet; the API and behaviour may change.
In the meantime, continue using [Webpack SSR](./webpack-ssr.md).
:::

Your apps own logging, with multiple layers available for you to log. Wire it where the event happens:

| Surface                   | Where                     | For                                                |
| ------------------------- | ------------------------- | -------------------------------------------------- |
| Express middleware        | Server entry `middleware` | Each HTTP request / response                       |
| Server `instrumentations` | Server entry              | Server-side loaders, actions, and route middleware |
| Client `instrumentations` | Client entry              | Client navigations, fetches, and loaders           |
| `onListen`                | Server entry              | Server start (bound port, readiness)               |

For whole-request access logs, use Express [middleware](./middleware.md).

## React Router instrumentations

Optional React Router [instrumentations](https://reactrouter.com/how-to/instrumentation) on each request entry.

Static handlers accept **route-level** instrumentations only:

```ts
instrumentations?: Pick<ServerInstrumentation, 'route'>[];
```

Client instrumentations forward into `createBrowserRouter`:

```ts
instrumentations?: ClientInstrumentation[];
```

See React Router’s [instrumentation guide](https://reactrouter.com/how-to/instrumentation) for shapes and examples.
