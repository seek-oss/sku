import type { SkuContext } from '../../../context/createSkuContext.js';
import { allocateClientPort } from '../helpers/allocateClientPort.js';
import { printServerUrls } from '../helpers/printServerUrls.js';
import { createDevSsrServer } from './createDevSsrServer.js';

export const startSsr = async ({
  skuContext,
  environment,
}: {
  skuContext: SkuContext;
  environment: string;
}) => {
  const { skuContext: skuContextOverride, port } =
    await allocateClientPort(skuContext);

  const { vite } = await createDevSsrServer({
    skuContext: skuContextOverride,
    environment,
  });

  printServerUrls({
    skuContext: skuContextOverride,
    port,
  });
  vite.bindCLIShortcuts({ print: true });
};
