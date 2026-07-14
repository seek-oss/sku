import type { SkuSsrOnRequest } from '../ssr/types.js';

/** Default when the consumer omits `serverEntry`. */
export const onRequest: SkuSsrOnRequest = () => ({});
