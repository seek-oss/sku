import { createContext, useContext, type ReactNode } from 'react';

import type {
  ClientContextOf,
  ReactContextOf,
  SiteOf,
} from './entryTypeExtractors.js';

/**
 * Render-scoped bag for SSR: always mounted by sku outside the router.
 */
type SkuProviderValue = {
  site: string;
  clientContext: unknown;
  reactContext: unknown;
};

const SkuProviderContext = createContext<SkuProviderValue | null>(null);

export const SkuProvider = ({
  site,
  clientContext,
  reactContext,
  children,
}: {
  site: string;
  clientContext: unknown;
  reactContext: unknown;
  children: ReactNode;
}) => (
  <SkuProviderContext.Provider value={{ site, clientContext, reactContext }}>
    {children}
  </SkuProviderContext.Provider>
);

type ReactContextUnion<ServerEntry, ClientEntry> =
  ReactContextOf<ServerEntry> | ReactContextOf<ClientEntry>;

/**
 * Typed facade over the always-on `SkuProvider`. Pass `typeof` the
 * default-exported entry objects — no hand-written `Site` / `ClientContext` /
 * `ReactContext` aliases required.
 *
 * - `Site` from the server entry’s `getSite` return (`string` when omitted)
 * - `ClientContext` from the server entry’s `getClientContext` return (`Awaited`)
 * - `ReactContext` from both entries’ `getReactContext` returns (union, `Awaited`)
 */
export function createSkuContexts<ServerEntry, ClientEntry = unknown>() {
  type Site = SiteOf<ServerEntry>;
  type ClientContext = ClientContextOf<ServerEntry>;
  type ReactContext = ReactContextUnion<ServerEntry, ClientEntry>;

  const useSkuProviderContext = (): SkuProviderValue => {
    const value = useContext(SkuProviderContext);
    if (value == null) {
      throw new Error('sku SSR context hooks must be used within SkuProvider');
    }
    return value;
  };

  return {
    useSite: (): Site => useSkuProviderContext().site as Site,
    useClientContext: (): ClientContext =>
      useSkuProviderContext().clientContext as ClientContext,
    useReactContext: (): ReactContext =>
      useSkuProviderContext().reactContext as ReactContext,
  };
}
