import { createSkuSsrContexts } from 'sku/ssr';

import type client from './client.js';
import type server from './server.js';

export const { useSite, useClientContext, useReactContext } =
  createSkuSsrContexts<typeof server, typeof client>();
