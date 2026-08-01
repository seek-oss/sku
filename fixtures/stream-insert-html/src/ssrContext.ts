import type server from './server.js';
import type client from './client.js';
import { createSkuSsrContexts } from 'sku/ssr';

export const { useSite, useClientContext, useReactContext } =
  createSkuSsrContexts<typeof server, typeof client>();
