# Logging / Observability

> [!CAUTION]
> Experimental — not for production.
> Managed Data Mode SSR is available for evaluation and testing.
> Do not use it in production yet.
> The API and behaviour may change.
> Until then, continue using [Webpack SSR](./webpack-ssr.md).

Your app controls logging.
Wire it where the event happens:

| Layer                     | Where                     | For                                                |
| ------------------------- | ------------------------- | -------------------------------------------------- |
| Express middleware        | Server entry `middleware` | Each HTTP request and response                     |
| Server `instrumentations` | Server entry              | Server-side loaders, actions, and route middleware |
| Client `instrumentations` | Client entry              | Client navigations, fetches, and loaders           |
| `onListen`                | Server entry              | Server start (bound port, readiness)               |
| `onShutdown`              | Server entry              | Flush buffered logs and telemetry                  |

For whole-request access logs, use Express [middleware](./middleware.md#server-entry-middleware).

## React Router instrumentations

Optional React Router [instrumentations](https://reactrouter.com/how-to/instrumentation) are callbacks that wrap route work such as loaders.
They attach to each request entry.

Static handlers accept **route-level** instrumentations only:

```ts
type ServerEntry = {
  instrumentations?: Array<Pick<ServerInstrumentation, 'route'>>;
};
```

Client instrumentations forward into `createBrowserRouter`:

```ts
type ClientEntry = {
  instrumentations?: ClientInstrumentation[];
};
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

## Shutdown

Production calls [`onShutdown`](./entries.md#onshutdown) after in-flight responses finish, then exits.
sku does not start or flush your logger or telemetry.
Start the clients you use when the server entry loads, and flush them here.
Await each flush inside the 25 second deadline.
When more than one client needs a flush, await them in the same `onShutdown` so they share that deadline.
Do not register a `SIGTERM` listener, and do not call `process.exit`.

A flush that takes a callback has to be wrapped in a promise.
`hot-shots` does this.
`client.close(callback)` flushes buffered StatsD metrics and resolves when the socket has closed.

```tsx
import { defineServerEntry } from 'sku/runtime';
import { StatsD } from 'hot-shots';

const statsd = new StatsD();

const server = defineServerEntry({
  onShutdown: () =>
    new Promise<void>((resolve, reject) => {
      statsd.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    }),
});

export default server;
```

`dd-trace` publishes no trace flush that resolves when the agent has the spans.
Call `tracer.init()` before the rest of the app loads, call `tracer.dogstatsd.flush()` for buffered DogStatsD metrics, then wait out one trace flush interval (default 2 seconds).
Traces submit on that interval and otherwise drain on `beforeExit`, which `process.exit` skips.

A flush that returns a promise is awaited directly.
OpenTelemetry providers do this with `shutdown()`, which flushes buffered spans, metrics, or logs.
`@opentelemetry/sdk-node`, `@opentelemetry/sdk-metrics`, and `@opentelemetry/sdk-logs` use the same call.

```tsx
import { defineServerEntry } from 'sku/runtime';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';

const tracerProvider = new NodeTracerProvider({
  spanProcessors: [new BatchSpanProcessor(new OTLPTraceExporter())],
});
tracerProvider.register();

const server = defineServerEntry({
  onShutdown: () => tracerProvider.shutdown(),
});

export default server;
```

Pino follows the `hot-shots` shape when the destination buffers: `pino.destination({ sync: false })` and `logger.flush(callback)`.

`@launchdarkly/node-server-sdk` does not flush analytics when it closes.
Await `flush()`, then call `close()`.

## See also

- [Middleware](./middleware.md) — Express access logs and request handlers
- [Request entries](./entries.md#onlisten) — `onListen` for start-up logging
- [Data loading](./data-loading.md) — loaders and actions you may instrument
