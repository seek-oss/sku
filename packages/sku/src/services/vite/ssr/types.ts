import type { ComponentType, ReactNode } from 'react';
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
 * Props sku passes to an entry's optional named `Providers` export.
 * `site` and `clientContext` are the same values on server and client for a
 * given document, so both sides render identically.
 */
export type SkuSsrProvidersProps<Context extends JsonValue = JsonValue> = {
  children: ReactNode;
  /** `onRequest.site` — the site whose pre-built route tree is rendered. */
  site: string;
  /** The request's `onRequest.clientContext` seed (undefined when omitted). */
  clientContext: Context | undefined;
};

/**
 * Optional named `Providers` export on `serverEntry` / `clientEntry`: dependency
 * injection rendered *outside* the router (`Document` → `Providers` → router),
 * so it must not use React Router hooks and must not render DOM.
 * Router-aware wrapping belongs in the app's own root layout route.
 */
export type SkuSsrProviders<Context extends JsonValue = JsonValue> =
  ComponentType<SkuSsrProvidersProps<Context>>;

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
 * Closed return object from the Vite SSR `onRequest` export.
 * `site` is required; other fields are optional.
 */
export type SkuSsrOnRequestResult = {
  /** App-owned site name — selects the pre-built site route tree (required). */
  site: string;
  /** Configured language name (or `en-PSEUDO`) for language chunk registration. */
  language?: string;
  /** Shell-time JSON seed serialised into the hydrate bootstrap. */
  clientContext?: JsonValue;
};

export type SkuSsrOnRequest = (args: {
  /** Express request after consumer middleware (not Fetch `Request`). */
  req: ExpressRequest;
}) => SkuSsrOnRequestResult | Promise<SkuSsrOnRequestResult>;

/**
 * Optional server-entry `getContext` — seeds React Router `requestContext` for
 * document `query()` / loaders. Separate from `onRequest` (React providers).
 */
export type SkuSsrServerGetContext = (args: {
  /** Fetch `Request` — same shape as `query()` / loaders. */
  request: Request;
  /** Express request after consumer middleware. */
  req: ExpressRequest;
}) => RouterContextProvider | Promise<RouterContextProvider>;

/** Hydrate side effects only — providers come from the named `Providers` export. */
export type SkuSsrOnHydrate = (args: {
  clientContext: JsonValue | undefined;
}) => void;

/**
 * Optional client-entry `getContext` — passed to `createBrowserRouter({ getContext })`
 * (sku wraps RR’s zero-arg API and injects hydrate `clientContext`).
 */
export type SkuSsrClientGetContext = (args: {
  clientContext?: JsonValue;
}) => RouterContextProvider;

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
    /** Hydrated `onRequest.site` — selects the same pre-built client site tree. */
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
