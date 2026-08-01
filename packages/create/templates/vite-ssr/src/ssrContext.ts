import type server from './server';
import type client from './client';
import { createSkuSsrContexts } from 'sku/ssr';

/**
 * Typed hooks bound to this app's entry objects. Request seeds
 * (`site` / `clientContext` / `reactContext`) come from SkuSsrProvider.
 */
export const { useSite, useClientContext, useReactContext } =
  createSkuSsrContexts<typeof server, typeof client>();
