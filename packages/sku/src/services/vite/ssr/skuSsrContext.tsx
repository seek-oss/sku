import { createContext, useContext, type ReactNode } from 'react';

import type {
  ClientContextOf,
  ReactContextOf,
  SiteOf,
} from './entryTypeExtractors.js';

/**
 * Render-scoped bag for Vite SSR: always mounted by sku outside the router.
 * Shared by `render` / the client entry and consumer hooks via the unbundled
 * module graph (`sku/ssr`) — same identity mechanism as `useInsertHtml`.
 */
type SkuSsrContextValue = {
  site: string;
  clientContext: unknown;
  reactContext: unknown;
};

const SkuSsrContext = createContext<SkuSsrContextValue | null>(null);

export const SkuSsrProvider = ({
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
  <SkuSsrContext.Provider value={{ site, clientContext, reactContext }}>
    {children}
  </SkuSsrContext.Provider>
);

type ReactContextUnion<ServerEntry, ClientEntry> =
  ReactContextOf<ServerEntry> | ReactContextOf<ClientEntry>;

/**
 * Typed facade over the always-on `SkuSsrProvider`. Pass `typeof` the
 * default-exported entry objects — no hand-written `Site` / `ClientContext` /
 * `ReactContext` aliases required.
 *
 * - `Site` from the server entry’s `getSite` return (`string` when omitted)
 * - `ClientContext` from the server entry’s `getClientContext` return
 * - `ReactContext` from both entries’ `getReactContext` returns (union)
 */
export function createSkuSsrContexts<ServerEntry, ClientEntry = unknown>() {
  type Site = SiteOf<ServerEntry>;
  type ClientContext = ClientContextOf<ServerEntry>;
  type ReactContext = ReactContextUnion<ServerEntry, ClientEntry>;

  const useSkuSsrContext = (): SkuSsrContextValue => {
    const value = useContext(SkuSsrContext);
    if (value == null) {
      throw new Error(
        'sku SSR context hooks must be used within SkuSsrProvider',
      );
    }
    return value;
  };

  return {
    useSite: (): Site => useSkuSsrContext().site as Site,
    useClientContext: (): ClientContext =>
      useSkuSsrContext().clientContext as ClientContext,
    useReactContext: (): ReactContext =>
      useSkuSsrContext().reactContext as ReactContext,
  };
}
