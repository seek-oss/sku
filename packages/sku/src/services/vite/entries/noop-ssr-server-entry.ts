import type { SkuSsrServerEntry } from '../ssr/types.js';

/** Default when the consumer omits `serverEntry`. */
const onRequest: SkuSsrServerEntry = () => ({});

export default onRequest;
