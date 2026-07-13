import { createCspNonce } from './csp.js';
import './installSsrRequestContextStorage.js';
import type { SsrRequestContextStore } from './requestContext.js';

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
