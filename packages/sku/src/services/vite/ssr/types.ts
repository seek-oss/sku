import type {
  Request as ExpressRequest,
  RequestHandler,
  Express,
} from 'express';
import type { Server as HttpServer } from 'node:http';
import type { Server as HttpsServer } from 'node:https';
import type {
  ClientInstrumentation,
  HydrationState,
  RouteObject,
  RouterContextProvider,
  ServerInstrumentation,
  StaticHandler,
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

/** Connect-compatible middleware from the SSR server entry. */
export type SkuMiddleware = RequestHandler[];

/**
 * Optional server-entry post-listen hook — same window as webpack SSR `onStart`.
 * Called once after middleware + HTML are mounted and `listen` succeeds.
 */
export type SkuOnListen = (args: {
  app: Express;
  httpServer: HttpServer | HttpsServer;
  port: number;
}) => void | Promise<void>;

/** JSON-serialisable shell seed for SSR `clientContext`. */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | Array<JsonValue | undefined>
  | { [key: string]: JsonValue | undefined };

export type { SiteOf } from './entryTypeExtractors.js';

/**
 * Route object for `routesEntry`: React Router `RouteObject` plus optional
 * `sites` membership. Omit `sites` ⇒ route is on every config site; present ⇒
 * only those names. Sku type helper only — not a wrapped RR re-export.
 * `children` are also `SkuRouteObject` so nested routes may set `sites`
 * (no parent→child inheritance — each route declares membership explicitly).
 */
export type SkuRouteObject<Site extends string = string> = Omit<
  RouteObject,
  'children'
> & {
  sites?: Site[];
  children?: Array<SkuRouteObject<Site>>;
};

/**
 * Args for optional `routesEntry` `mapRoutePath`.
 * Called while pre-building each site tree (after `sites` membership filter).
 */
export type MapRoutePathArgs = {
  /**
   * This route’s own authored `path`, or `''` when the route is `index: true`.
   */
  path: string;
  /** Resolved site name for the tree being built. */
  site: string;
  /**
   * Authored `path` values from path-bearing ancestors only (pathless layouts
   * and index ancestors omitted), not including the current route.
   * Source (pre-mapping) segments.
   */
  parentSegments: string[];
};

/**
 * Optional `routesEntry` hook — map one logical path to concrete paths per site.
 * Return `string[]` replacement paths (empty ⇒ omit).
 * Omitted export ⇒ identity (`[path]` / `['']` for index).
 * For an index source, `''` keeps `index: true`; a non-empty string becomes a
 * `path` clone without `index`.
 */
export type MapRoutePath = (args: MapRoutePathArgs) => string[];

/**
 * Sync server-entry getter — app-owned site name selecting the pre-built tree.
 * Required when config `sites` has more than one entry; optional on single-site
 * (sku uses the sole config site name when omitted).
 */
export type SkuGetSite = (args: {
  /** Express request after consumer middleware (not Fetch `Request`). */
  req: ExpressRequest;
}) => string;

/**
 * Sync server-entry getter — configured language name (or `en-PSEUDO`) for
 * Document vocab chunk registration. Omit or return `undefined` ⇒ no chunk.
 */
export type SkuGetLanguage = (args: {
  req: ExpressRequest;
}) => string | undefined;

/**
 * Server-entry getter — shell-time JSON seed serialised into the hydrate
 * bootstrap and passed to always-on `SkuProvider` as `clientContext`.
 */
export type SkuGetClientContext = (args: {
  req: ExpressRequest;
}) => JsonValue | undefined | Promise<JsonValue | undefined>;

/**
 * Dual-entry getter — values that MAY differ on server vs client (e.g.
 * `makeClient`, `apiClient`). Not serialised; reaches React via `useReactContext`.
 */
export type SkuServerGetReactContext<
  C extends JsonValue | undefined = JsonValue | undefined,
  R = unknown,
> = (args: {
  req: ExpressRequest;
  site: string;
  clientContext: C | undefined;
}) => R | Promise<R>;

export type SkuClientGetReactContext<
  C extends JsonValue | undefined = JsonValue | undefined,
  R = unknown,
> = (args: { site: string; clientContext: C | undefined }) => R | Promise<R>;

/**
 * Optional server-entry `getRouterContext` — seeds React Router `requestContext`
 * for document `query()` / loaders. Receives already-resolved sibling values.
 */
export type SkuServerGetRouterContext<
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

/** Hydrate side effects only — request values reach React via `SkuProvider`. */
export type SkuOnHydrate = (args: {
  clientContext: JsonValue | undefined;
}) => void;

/**
 * Optional client-entry `getRouterContext` — sku wraps into React Router’s
 * native `createBrowserRouter({ getContext })` (zero-arg) and injects hydrate
 * sibling values (`site`, `clientContext`, `reactContext`).
 */
export type SkuClientGetRouterContext<
  C extends JsonValue | undefined = JsonValue | undefined,
  R = unknown,
> = (args: {
  site: string;
  clientContext: C | undefined;
  reactContext: R | undefined;
}) => RouterContextProvider | Promise<RouterContextProvider>;

/**
 * Structural shape of a SSR `serverEntry` default export (prefer
 * `defineServerEntry` for sibling inference).
 */
export type SkuServerEntry<
  C extends JsonValue | undefined = JsonValue | undefined,
  R = unknown,
> = {
  getSite?: SkuGetSite;
  getLanguage?: SkuGetLanguage;
  getClientContext?: (args: { req: ExpressRequest }) => C | Promise<C>;
  getReactContext?: SkuServerGetReactContext<C, R>;
  middleware?: SkuMiddleware;
  onListen?: SkuOnListen;
  getRouterContext?: SkuServerGetRouterContext<C, R>;
  instrumentations?: Array<Pick<ServerInstrumentation, 'route'>>;
};

/**
 * Structural shape of a SSR `clientEntry` default export (prefer
 * `defineClientEntry` for sibling inference).
 */
export type SkuClientEntry<
  C extends JsonValue | undefined = JsonValue | undefined,
  R = unknown,
> = {
  onHydrate?: SkuOnHydrate;
  getReactContext?: SkuClientGetReactContext<C, R>;
  getRouterContext?: SkuClientGetRouterContext<C, R>;
  instrumentations?: ClientInstrumentation[];
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
  /** Document render deadline in ms. Default 10_000. */
  renderTimeoutMs?: number;
}

export interface RenderArgs {
  siteStaticHandlers: Record<string, StaticHandler>;
  request: Request;
  req: ExpressRequest;
  assets: RenderAssets;
  /** Required when config has >1 site; omit on single-site ⇒ sole config site. */
  getSite?: SkuGetSite;
  getLanguage?: SkuGetLanguage;
  getClientContext?: SkuGetClientContext;
  getReactContext?: SkuServerGetReactContext;
  options?: RenderOptions;
  renderManifest?: RenderManifest;
  getRouterContext?: SkuServerGetRouterContext;
}

export type DocumentDestination = Parameters<PipeableStream['pipe']>[0];

export type CommitDocumentOptions = {
  signal?: AbortSignal;
  beforePipe?: (destination: DocumentDestination) => void;
};

export type CommitDocument = (
  destination: DocumentDestination,
  options?: CommitDocumentOptions,
) => void;

export interface RenderSuccess {
  statusCode: number;
  headers: Headers;
  inlineScripts: string[];
  commit: CommitDocument;
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
     * SSR: mint/reuse the single request-scoped CSP nonce.
     * Only include `'nonce-…'` in CSP after this (or `getCspNonce()`) is called.
     */
    getCspNonce?: () => string;
  }
}
