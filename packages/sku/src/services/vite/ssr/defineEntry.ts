import type { Request as ExpressRequest } from 'express';
import type { RouterContextProvider } from 'react-router';

import type { ClientContextOf, SiteOf } from './entryTypeExtractors.js';
import type { JsonValue, SkuMiddleware, SkuOnListen } from './types.js';

export type ServerEntryBody<
  Site extends string = string,
  Language extends string | undefined = string | undefined,
  ClientContext extends JsonValue | undefined = undefined,
  ReactContext = undefined,
> = {
  /** Resolves the active site name for this request */
  getSite?: (args: { req: ExpressRequest }) => Site;
  /** Resolves the language for Document vocab chunk registration. */
  getLanguage?: (args: { req: ExpressRequest }) => Language;
  /** JSON seed serialised to the client and passed to React and Router context. */
  getClientContext?: (args: { req: ExpressRequest }) => ClientContext;
  /** Server-specific values for React via `useReactContext` (e.g. API clients). */
  getReactContext?: (args: {
    req: ExpressRequest;
    site: NoInfer<Site>;
    clientContext: NoInfer<ClientContext> | undefined;
  }) => ReactContext;
  /** Server-specific values for Router Router context (loaders, actions and middleware) */
  getRouterContext?: (args: {
    request: Request;
    req: ExpressRequest;
    site: NoInfer<Site>;
    clientContext: NoInfer<ClientContext> | undefined;
    reactContext: NoInfer<ReactContext> | undefined;
  }) => RouterContextProvider | Promise<RouterContextProvider>;
  /** Express middleware run before SSR for each request. */
  middleware?: SkuMiddleware;
  /**
   * Called once after middleware + HTML are mounted and `listen` succeeds
   * (start + production). Not re-fired on server-entry HMR.
   */
  onListen?: SkuOnListen;
};

/**
 * Zero-runtime identity helper — creates a TypeScript inference scope so
 * getter returns type later sibling args.
 */
export function defineServerEntry<
  Site extends string = string,
  Language extends string | undefined = string | undefined,
  ClientContext extends JsonValue | undefined = undefined,
  ReactContext = undefined,
>(
  entry: ServerEntryBody<Site, Language, ClientContext, ReactContext>,
): ServerEntryBody<Site, Language, ClientContext, ReactContext> {
  return entry;
}

type ClientEntryBody<ServerEntry, ReactContext> = {
  /** Side effects to run before client React hydrate. */
  onHydrate?: (args: {
    clientContext: ClientContextOf<ServerEntry> | undefined;
  }) => void;
  /** Client-specific values for React via `useReactContext` (e.g. API clients). */
  getReactContext?: (args: {
    site: SiteOf<ServerEntry>;
    clientContext: NoInfer<ClientContextOf<ServerEntry>> | undefined;
  }) => ReactContext;
  /** Client-specific values for Router Router context (loaders, actions and middleware) */
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
 * Zero-runtime identity helper for the SSR client entry object.
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
