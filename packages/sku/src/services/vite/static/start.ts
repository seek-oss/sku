import { createServer } from 'vite';

import type { SkuContext } from '../../../context/createSkuContext.js';
import { allocateClientPort } from '../helpers/allocateClientPort.js';
import { createConfig } from '../helpers/config/createConfig.js';
import { printServerUrls } from '../helpers/printServerUrls.js';

export const startStatic = async ({
  skuContext,
  environment,
}: {
  skuContext: SkuContext;
  environment: string;
}) => {
  const { skuContext: skuContextOverride, port } =
    await allocateClientPort(skuContext);

  const viteServer = await createServer(
    createConfig(skuContextOverride, environment),
  );
  await viteServer.listen(port);

  printServerUrls({
    skuContext: skuContextOverride,
    port,
  });
  viteServer.bindCLIShortcuts({ print: true });
};
