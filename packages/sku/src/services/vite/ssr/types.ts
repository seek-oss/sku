import type { ComponentType, ReactNode } from 'react';
import type { RequestHandler } from 'express';
import type {
  HydrationState,
  RouteObject,
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

export interface SkuApp {
  routes: RouteObject[];
  middleware?: RequestHandler | RequestHandler[];
}

/** JSON-serialisable shell seed for Vite SSR `clientContext`. */
export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/** Provider wrapper around the router tree (not page layout / Document). */
export type SkuSsrAppWrapper = ComponentType<{ children: ReactNode }>;

/** Closed return bag from the optional Vite SSR server request entry. */
export type SkuSsrServerEntryResult = {
  AppWrapper?: SkuSsrAppWrapper;
  /** Configured language name (or `en-PSEUDO`) for vocab chunk identity. */
  language?: string;
  /** Shell-time JSON seed serialised into the hydrate bootstrap. */
  clientContext?: JsonValue;
};

export type SkuSsrServerEntry = (args: {
  request: Request;
}) => SkuSsrServerEntryResult | Promise<SkuSsrServerEntryResult>;

/** Closed return bag from the optional Vite SSR client request entry. */
export type SkuSsrClientEntryResult = {
  AppWrapper?: SkuSsrAppWrapper;
};

export type SkuSsrClientEntry = (args: {
  context: JsonValue | undefined;
  language: string | undefined;
}) => SkuSsrClientEntryResult;

export interface RenderManifest {
  manifest: ClientManifest;
  base: string;
  entry: ManifestChunk;
}

export interface RenderOptions {
  signal?: AbortSignal;
  nonce?: string;
  /** Shared request context for this render (CSP nonce + language). */
  requestContextStore?: SsrRequestContextStore;
  /** @deprecated Use `requestContextStore`. */
  cspNonceStore?: SsrRequestContextStore;
  development?: boolean;
  /** Configured language names for vocab chunk registration. */
  languages?: string[];
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
    __SKU_LANGUAGE__?: string;
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
