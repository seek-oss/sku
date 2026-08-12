import { createCspNonce } from './csp.js';
import './installSsrRequestContextStorage.js';
import type { SsrRequestContextStore } from './requestContext.js';

export const createSsrRequestContextStore = (
  initialNonce?: string,
): SsrRequestContextStore => {
  let nonce = initialNonce;
  return {
    getCspNonce: () => {
      nonce ??= createCspNonce();
      return nonce;
    },
    peekCspNonce: () => nonce,
  };
};
