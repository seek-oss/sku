import { defineServerEntry } from 'sku/runtime';

import { getSite } from './config.js';
import { middleware } from './middleware.js';

const server = defineServerEntry({
  onListen({ port }) {
    // eslint-disable-next-line no-console
    console.log('Server is listening on port', port);
  },
  getSite,
  middleware,
});

export default server;
