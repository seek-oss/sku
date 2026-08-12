import { createSkuContexts } from 'sku/runtime';

import type client from './client.js';
import type server from './server.js';

export const { useSite } = createSkuContexts<typeof server, typeof client>();
