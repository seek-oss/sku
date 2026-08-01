import type { Request as ExpressRequest } from 'express';
import type { RouterContextProvider } from 'react-router';

import type { ClientContextOf, SiteOf } from './entryTypeExtractors.js';
import type { JsonValue, SkuSsrMiddleware } from './types.js';

/**
 * Zero-runtime identity helper — creates a TypeScript inference scope so
 * getter returns type later sibling args.
 */
export function defineServerEntry<
  Site extends string = string,
  Language extends string | undefined = string | undefined,
  ClientContext extends JsonValue | undefined = undefined,
  ReactContext = undefined,
>(entry: {
  getSite?: (args: { req: ExpressRequest }) => Site;
  getLanguage?: (args: { req: ExpressRequest }) => Language;
  getClientContext?: (args: { req: ExpressRequest }) => ClientContext;
  getReactContext?: (args: {
    req: ExpressRequest;
    site: NoInfer<Site>;
    clientContext: NoInfer<ClientContext> | undefined;
  }) => ReactContext;
  middleware?: SkuSsrMiddleware;
  getRouterContext?: (args: {
    request: Request;
    req: ExpressRequest;
    site: NoInfer<Site>;
    clientContext: NoInfer<ClientContext> | undefined;
    reactContext: NoInfer<ReactContext> | undefined;
  }) => RouterContextProvider | Promise<RouterContextProvider>;
}) {
  return entry;
}

type ClientEntryBody<ServerEntry, ReactContext> = {
  onHydrate?: (args: {
    clientContext: ClientContextOf<ServerEntry> | undefined;
  }) => void;
  getReactContext?: (args: {
    site: SiteOf<ServerEntry>;
    clientContext: NoInfer<ClientContextOf<ServerEntry>> | undefined;
  }) => ReactContext;
  getRouterContext?: (args: {
    site: SiteOf<ServerEntry>;
    clientContext: NoInfer<ClientContextOf<ServerEntry>> | undefined;
    reactContext: NoInfer<ReactContext> | undefined;
  }) => RouterContextProvider;
};

/** Empty server-entry shape — `SiteOf` / `ClientContextOf` → `string` / `undefined`. */
declare const noServerEntryBrand: unique symbol;
type NoServerEntry = { readonly [noServerEntryBrand]?: never };

/**
 * Zero-runtime identity helper for the Vite SSR client entry object.
 *
 * Pass `typeof` the server entry so `Site` / `ClientContext` match
 * `getSite` / `getClientContext` (client callbacks cannot infer those —
 * they only appear as inputs). Still infers `ReactContext` from client
 * `getReactContext`.
 *
 * TypeScript cannot partially infer type parameters, so binding a server
 * entry is curried: `defineClientEntry<typeof server>()({ … })`.
 * Omit the type argument and call directly —
 * `defineClientEntry({ … })` — for `site: string` and
 * `clientContext: undefined`.
 */
export function defineClientEntry<ServerEntry>(): <ReactContext = undefined>(
  entry: ClientEntryBody<ServerEntry, ReactContext>,
) => ClientEntryBody<ServerEntry, ReactContext>;
export function defineClientEntry<ReactContext = undefined>(
  entry: ClientEntryBody<NoServerEntry, ReactContext>,
): ClientEntryBody<NoServerEntry, ReactContext>;
export function defineClientEntry(
  entry?: object,
): object | ((inner: object) => object) {
  if (entry === undefined) {
    return (innerEntry: object) => innerEntry;
  }
  return entry;
}
