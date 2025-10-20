import type { Server } from 'sku';

// Not testing UI so intentionally empty
export default (): Server => ({
  renderCallback: async () => {},
});
