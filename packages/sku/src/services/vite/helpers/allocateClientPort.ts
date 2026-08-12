import type { SkuContext } from '../../../context/createSkuContext.js';
import allocatePort from '../../../utils/allocatePort.js';

export const allocateClientPort = async (
  skuContext: SkuContext,
): Promise<{ skuContext: SkuContext; port: number }> => {
  const port = await allocatePort({
    port: skuContext.port.client,
    strictPort: skuContext.port.strictPort,
  });

  return {
    port,
    skuContext: {
      ...skuContext,
      port: {
        ...skuContext.port,
        client: port,
      },
    },
  };
};
