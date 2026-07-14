import type { SkuSsrOnHydrate } from '../ssr/types.js';

/** Default when the consumer omits `clientEntry`. */
export const onHydrate: SkuSsrOnHydrate = () => ({});
