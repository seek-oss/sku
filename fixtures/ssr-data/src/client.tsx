import { RouterContextProvider } from 'react-router';
import { defineClientEntry as defineClientEntryFromServer } from 'sku/runtime';

import type server from './server.js';
import { userIdContext } from './userIdContext.js';

const defineClientEntry = defineClientEntryFromServer<typeof server>();

const client = defineClientEntry({
  onHydrate({ clientContext }) {
    if (!clientContext?.fromServer) {
      throw new Error('Missing client context');
    }
  },
  getRouterContext({ clientContext }) {
    const ctx = new RouterContextProvider();
    ctx.set(userIdContext, clientContext?.userId ?? null);
    return ctx;
  },
});

export default client;
