import type server from './server';
import type client from './client';
import { createSkuContexts } from 'sku/runtime';

/**
 * Typed hooks bound to this app's entry objects. Request seeds
 * (`site` / `clientContext` / `reactContext`) come from SkuProvider.
 */
export const { useSite, useClientContext, useReactContext } = createSkuContexts<
  typeof server,
  typeof client
>();
