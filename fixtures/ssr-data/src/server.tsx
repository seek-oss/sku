import { RouterContextProvider } from 'react-router';
import { defineServerEntry } from 'sku/runtime';

import { middleware } from './middleware.js';
import { userIdContext } from './userIdContext.js';

const server = defineServerEntry({
  onListen({ port }) {
    // eslint-disable-next-line no-console
    console.log('Server is listening on port', port);
  },
  getClientContext({ req }) {
    return {
      fromServer: true as const,
      userId: req.skuUserId ?? null,
    };
  },
  getRouterContext({ clientContext }) {
    const ctx = new RouterContextProvider();
    ctx.set(userIdContext, clientContext?.userId ?? null);
    return ctx;
  },
  middleware,
});

export default server;
