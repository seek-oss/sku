import { AsyncLocalStorage } from 'node:async_hooks';
import { createCspNonce } from './csp.js';

export type SsrRequestContextStore = {
  /** Mint at most one nonce for this request, then reuse it. */
  getCspNonce: () => string;
  /** Return the minted nonce if one was requested; otherwise `undefined`. */
  peekCspNonce: () => string | undefined;
  /** Active language name for vocab chunk registration, if set. */
  getLanguage: () => string | undefined;
  /** Set the request language slot (configured language name). */
  setLanguage: (language: string | undefined) => void;
};

/** @deprecated Use `SsrRequestContextStore`. Kept for call-site clarity during rename. */
export type SsrCspNonceStore = SsrRequestContextStore;

type ContextStorage = {
  getStore: () => SsrRequestContextStore | undefined;
  run: <T>(context: SsrRequestContextStore, fn: () => T) => T;
};

const noopStorage: ContextStorage = {
  getStore: () => undefined,
  run: (_context, fn) => fn(),
};

/**
 * AsyncLocalStorage is Node-only. Route modules import helpers from `sku`
 * and are shared with the client bundle, so construction must tolerate the
 * browser (where Vite externalizes `node:async_hooks` to a non-constructor).
 */
const storage: ContextStorage =
  typeof AsyncLocalStorage === 'function'
    ? new AsyncLocalStorage<SsrRequestContextStore>()
    : noopStorage;

export const createSsrRequestContextStore = (
  initialNonce?: string,
): SsrRequestContextStore => {
  let nonce = initialNonce;
  let language: string | undefined;
  return {
    getCspNonce: () => {
      nonce ??= createCspNonce();
      return nonce;
    },
    peekCspNonce: () => nonce,
    getLanguage: () => language,
    setLanguage: (value) => {
      language = value;
    },
  };
};

/** Alias used by existing CSP-focused call sites. */
export const createSsrCspNonceStore = createSsrRequestContextStore;

/**
 * Returns the per-request CSP nonce for the current Vite SSR request.
 * First call mints a single value for the request; later calls reuse it.
 * Available in React Router loaders/actions while sku is rendering.
 * Express middleware should use `req.getCspNonce()` instead (same store).
 * Returns `undefined` in the browser (client navigations / hydration).
 */
export const getCspNonce = (): string | undefined =>
  storage.getStore()?.getCspNonce();

/** Returns the request nonce only if one was already requested. */
export const peekCspNonce = (): string | undefined =>
  storage.getStore()?.peekCspNonce();

/**
 * Returns the request language slot for the current Vite SSR request.
 * Prefer setting via Express `req.skuLanguage` in middleware; this helper
 * reads the same store from loaders/actions while sku is rendering.
 * Returns `undefined` in the browser.
 */
export const getSkuLanguage = (): string | undefined =>
  storage.getStore()?.getLanguage();

export const runWithSsrRequestContext = <T>(
  context: SsrRequestContextStore,
  fn: () => T,
): T => storage.run(context, fn);
