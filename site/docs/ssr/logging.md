# Logging / Observability

:::danger Experimental — not for production
Managed Data Mode SSR is available for evaluation and testing. Do not use it in production yet; the API and behaviour may change.
In the meantime, continue using [Webpack SSR](./webpack-ssr.md).
:::

Your app owns logging.
Wire it where the event happens:

| Layer                     | Where                     | For                                                |
| ------------------------- | ------------------------- | -------------------------------------------------- |
| Express middleware        | Server entry `middleware` | Each HTTP request / response                       |
| Server `instrumentations` | Server entry              | Server-side loaders, actions, and route middleware |
| Client `instrumentations` | Client entry              | Client navigations, fetches, and loaders           |
| `onListen`                | Server entry              | Server start (bound port, readiness)               |

For whole-request access logs, use Express [middleware](./middleware.md#server-entry-middleware).

## React Router instrumentations

Optional React Router [instrumentations](https://reactrouter.com/how-to/instrumentation) hang off each request entry.

Static handlers accept **route-level** instrumentations only:

```ts
instrumentations?: Pick<ServerInstrumentation, 'route'>[];
```

Client instrumentations forward into `createBrowserRouter`:

```ts
instrumentations?: ClientInstrumentation[];
```

Minimal server example that logs loader failures:

```tsx
// src/server.tsx
import type { ServerInstrumentation } from 'react-router';
import { defineServerEntry } from 'sku/runtime';

const routeInstrumentation: Pick<ServerInstrumentation, 'route'> = {
  route(route) {
    route.instrument({
      async loader(callLoader, info) {
        const { status, error } = await callLoader();
        if (status === 'error') {
          console.error('loader failed', {
            routeId: route.id,
            pattern: info.pattern,
            message: error?.message,
          });
        }
      },
    });
  },
};

const server = defineServerEntry({
  instrumentations: [routeInstrumentation],
  onListen({ port }) {
    console.log(`listening on ${port}`);
  },
});

export default server;
```

See React Router’s [instrumentation guide](https://reactrouter.com/how-to/instrumentation) for client shapes and fuller examples.

## See also

- [Middleware](./middleware.md) — Express access logs and request handlers
- [Request entries](./entries.md#onlisten) — `onListen` for start-up logging
- [Data loading](./data-loading.md) — loaders and actions you may instrument
