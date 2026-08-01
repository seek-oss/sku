import type { Request as ExpressRequest, RequestHandler } from 'express';
import type {
  HydrationState,
  RouteObject,
  RouterContextProvider,
  StaticHandlerContext,
} from 'react-router';
import type { PipeableStream } from 'react-dom/server';
import type { ClientManifest, ManifestChunk } from './resolveAssets.js';
import type { SsrRequestContextStore } from './requestContext.js';

export interface DocumentAssets {
  css: string[];
  modulePreloads: string[];
}

export interface RenderAssets extends DocumentAssets {
  bootstrapModules: string[];
}

/** Connect-compatible middleware from the Vite SSR server entry. */
export type SkuSsrMiddleware = RequestHandler | RequestHandler[];

/** JSON-serialisable shell seed for Vite SSR `clientContext`. */
export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/**
 * Route object for `routesEntry`: React Router `RouteObject` plus optional
 * `sites` membership. Omit `sites` ⇒ route is on every config site; present ⇒
 * only those names. Sku type helper only — not a wrapped RR re-export.
 * `children` are also `SkuSsrRouteObject` so nested routes may set `sites`
 * (no parent→child inheritance — each route declares membership explicitly).
 */
export type SkuSsrRouteObject = Omit<RouteObject, 'children'> & {
  sites?: string[];
  children?: SkuSsrRouteObject[];
};

/**
 * Sync server-entry getter — app-owned site name selecting the pre-built tree.
 * Required when config `sites` has more than one entry; optional on single-site
 * (sku uses the sole config site name when omitted).
 */
export type SkuSsrGetSite = (args: {
  /** Express request after consumer middleware (not Fetch `Request`). */
  req: ExpressRequest;
}) => string;

/**
 * Sync server-entry getter — configured language name (or `en-PSEUDO`) for
 * Document vocab chunk registration. Omit or return `undefined` ⇒ no chunk.
 */
export type SkuSsrGetLanguage = (args: {
  req: ExpressRequest;
}) => string | undefined;

/**
 * Sync server-entry getter — shell-time JSON seed serialised into the hydrate
 * bootstrap and passed to always-on `SkuSsrProvider` as `clientContext`.
 */
export type SkuSsrGetClientContext = (args: {
  req: ExpressRequest;
}) => JsonValue | undefined;

/**
 * Dual-entry getter — values that MAY differ on server vs client (e.g.
 * `makeClient`, `apiClient`). Not serialised; reaches React via `useReactContext`.
 */
export type SkuSsrServerGetReactContext<
  C extends JsonValue | undefined = JsonValue | undefined,
  R = unknown,
> = (args: {
  req: ExpressRequest;
  site: string;
  clientContext: C | undefined;
}) => R;

export type SkuSsrClientGetReactContext<
  C extends JsonValue | undefined = JsonValue | undefined,
  R = unknown,
> = (args: { site: string; clientContext: C | undefined }) => R;

/**
 * Optional server-entry `getRouterContext` — seeds React Router `requestContext`
 * for document `query()` / loaders. Receives already-resolved sibling values.
 */
export type SkuSsrServerGetRouterContext<
  C extends JsonValue | undefined = JsonValue | undefined,
  R = unknown,
> = (args: {
  /** Fetch `Request` — same shape as `query()` / loaders. */
  request: Request;
  /** Express request after consumer middleware. */
  req: ExpressRequest;
  site: string;
  clientContext: C | undefined;
  reactContext: R | undefined;
}) => RouterContextProvider | Promise<RouterContextProvider>;

/** Hydrate side effects only — request values reach React via `SkuSsrProvider`. */
export type SkuSsrOnHydrate = (args: {
  clientContext: JsonValue | undefined;
}) => void;

/**
 * Optional client-entry `getRouterContext` — sku wraps into React Router’s
 * native `createBrowserRouter({ getContext })` (zero-arg) and injects hydrate
 * sibling values (`site`, `clientContext`, `reactContext`).
 */
export type SkuSsrClientGetRouterContext<
  C extends JsonValue | undefined = JsonValue | undefined,
  R = unknown,
> = (args: {
  site: string;
  clientContext: C | undefined;
  reactContext: R | undefined;
}) => RouterContextProvider;

/**
 * Structural shape of a Vite SSR `serverEntry` default export (prefer
 * `defineServerEntry` for sibling inference).
 */
export type SkuSsrServerEntry<
  C extends JsonValue | undefined = JsonValue | undefined,
  R = unknown,
> = {
  getSite?: SkuSsrGetSite;
  getLanguage?: SkuSsrGetLanguage;
  getClientContext?: (args: { req: ExpressRequest }) => C;
  getReactContext?: SkuSsrServerGetReactContext<C, R>;
  middleware?: SkuSsrMiddleware;
  getRouterContext?: SkuSsrServerGetRouterContext<C, R>;
};

/**
 * Structural shape of a Vite SSR `clientEntry` default export (prefer
 * `defineClientEntry` for sibling inference).
 */
export type SkuSsrClientEntry<
  C extends JsonValue | undefined = JsonValue | undefined,
  R = unknown,
> = {
  onHydrate?: SkuSsrOnHydrate;
  getReactContext?: SkuSsrClientGetReactContext<C, R>;
  getRouterContext?: SkuSsrClientGetRouterContext<C, R>;
};

export interface RenderManifest {
  manifest: ClientManifest;
  publicPath: string;
  entry: ManifestChunk;
}

export interface RenderOptions {
  signal?: AbortSignal;
  nonce?: string;
  /** Shared request context for this render (CSP nonce). */
  requestContextStore?: SsrRequestContextStore;
  development?: boolean;
  onShellError?: (error: unknown) => void;
  onError?: (error: unknown) => void;
}

export interface RenderSuccess {
  pipe: PipeableStream['pipe'];
  abort: PipeableStream['abort'];
  statusCode: number;
  headers: Headers;
  inlineScripts: string[];
}

export type RenderResult = RenderSuccess | { response: Response };

export type SkuRouteHandle = {
  moduleId?: string;
  waitForAll?: boolean;
};

export type SerializableHydrationState = Pick<
  StaticHandlerContext,
  'loaderData' | 'actionData'
> & {
  errors: HydrationState['errors'];
};

declare global {
  interface Window {
    __SKU_DOCUMENT_ASSETS__?: DocumentAssets;
    __SKU_CLIENT_CONTEXT__?: JsonValue;
    /** Hydrated site — selects the same pre-built client site tree as SSR. */
    __SKU_SITE__?: string;
    __staticRouterHydrationData?: HydrationState;
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    /**
     * Vite SSR: mint/reuse the single request-scoped CSP nonce.
     * Only include `'nonce-…'` in CSP after this (or `getCspNonce()`) is called.
     */
    getCspNonce?: () => string;
  }
}
