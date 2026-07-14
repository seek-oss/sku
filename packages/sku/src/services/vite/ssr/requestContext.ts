export type SsrRequestContextStore = {
  /** Mint at most one nonce for this request, then reuse it. */
  getCspNonce: () => string;
  /** Return the minted nonce if one was requested; otherwise `undefined`. */
  peekCspNonce: () => string | undefined;
};

type ContextStorage = {
  getStore: () => SsrRequestContextStore | undefined;
  run: <T>(context: SsrRequestContextStore, fn: () => T) => T;
};

const noopStorage: ContextStorage = {
  getStore: () => undefined,
  run: (_context, fn) => fn(),
};

let storage: ContextStorage = noopStorage;

/**
 * Install AsyncLocalStorage-backed request context. Server-only — the shared
 * `requestContext` module is imported by client route code via `getCspNonce`,
 * so it must not statically import `node:async_hooks` (Vite's browser external
 * throws on any export access).
 */
export const installSsrRequestContextStorage = (next: ContextStorage): void => {
  storage = next;
};

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

export const runWithSsrRequestContext = <T>(
  context: SsrRequestContextStore,
  fn: () => T,
): T => storage.run(context, fn);
