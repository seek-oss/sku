import { Server as HttpsServer } from 'node:https';
import { defineServerEntry } from 'sku/runtime';

import { middleware } from './middleware.js';

const server = defineServerEntry({
  async onListen({ httpServer, port }) {
    // eslint-disable-next-line no-console
    console.log('Server is listening on port', port);

    if (!(httpServer instanceof HttpsServer)) {
      const live = await fetch(`http://127.0.0.1:${port}/livez`);
      const ready = await fetch(`http://127.0.0.1:${port}/readyz`);
      // eslint-disable-next-line no-console
      console.log('/livez during onListen:', live.status);
      // eslint-disable-next-line no-console
      console.log('/readyz during onListen:', ready.status);
    }
  },
  middleware,
});

export default server;
