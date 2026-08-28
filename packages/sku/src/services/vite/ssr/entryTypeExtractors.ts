/**
 * Entry objects from `define*Entry` keep getters optional on the type, so
 * extract via `keyof` + `NonNullable` rather than `extends { getX: … }`.
 * Shared by `defineClientEntry` and `createSkuContexts`.
 */

export type SiteOf<ServerEntry> = 'getSite' extends keyof ServerEntry
  ? NonNullable<ServerEntry['getSite']> extends (...args: never[]) => infer S
    ? S extends string
      ? S
      : string
    : string
  : string;

export type ClientContextOf<ServerEntry> =
  'getClientContext' extends keyof ServerEntry
    ? NonNullable<ServerEntry['getClientContext']> extends (
        ...args: never[]
      ) => infer C
      ? Awaited<C>
      : undefined
    : undefined;

export type ReactContextOf<Entry> = 'getReactContext' extends keyof Entry
  ? NonNullable<Entry['getReactContext']> extends (...args: never[]) => infer R
    ? Awaited<R>
    : undefined
  : undefined;
