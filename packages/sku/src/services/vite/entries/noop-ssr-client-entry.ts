import type { SkuSsrClientEntry } from '../ssr/types.js';

/** Default when the consumer omits `clientEntry`. */
const onHydrate: SkuSsrClientEntry = () => ({});

export default onHydrate;
