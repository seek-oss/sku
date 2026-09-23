---
'sku': minor
---

Webpack SSR: Pass the listening server and port to `onStart`

`onStart` still receives the Express app as its first argument. A new second argument carries `{ httpServer, port }`, so apps can set keep-alive timeouts and close the server on shutdown.

```tsx
import type { Server } from 'sku';

export default (): Server => ({
  renderCallback,
  onStart: (app, { httpServer, port }) => {
    httpServer.keepAliveTimeout = 20_000;
    process.on('SIGTERM', () => {
      httpServer.close(() => process.exit(0));
    });
  },
});
```

See the [Webpack SSR](https://seek-oss.github.io/sku/ssr/webpack-ssr) docs for more details.
