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

export interface RenderManifest {
  manifest: ClientManifest;
  base: string;
  entry: ManifestChunk;
}

export interface RenderOptions {
  signal?: AbortSignal;
  nonce?: string;
  /** Shared request context for this render (CSP nonce + language slot). */
  requestContextStore?: SsrRequestContextStore;
  /** @deprecated Use `requestContextStore`. */
  cspNonceStore?: SsrRequestContextStore;
  development?: boolean;
  /** Configured language names for vocab chunk registration. */
  languages?: string[];
  /**
   * App-owned request language slot (configured language name).
   * Prefer Express `req.skuLanguage`; this seeds the same store when set.
   */
  requestLanguage?: string;
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
    /**
     * Vite SSR: configured language **name** for vocab chunk registration
     * (e.g. `th-TH`). Prefer this over `:language` route heuristics when
     * locale is composed in middleware. Must match `languages` (or `en-PSEUDO`).
     */
    skuLanguage?: string;
  }
}
