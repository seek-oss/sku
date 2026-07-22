import type { SkuContext } from '../../../context/createSkuContext.js';
import { getAppHosts } from '../../../context/hosts.js';
import { serverUrls } from '@sku-private/utils';

export const printServerUrls = ({
  skuContext,
  port,
}: {
  skuContext: SkuContext;
  port: number;
}) => {
  const hosts = getAppHosts(skuContext);

  console.log('Starting development server...');
  const urls = serverUrls({
    hosts,
    port,
    initialPath: skuContext.initialPath,
    https: skuContext.httpsDevServer,
  });

  if (skuContext.listUrls) {
    urls.printAll();
  } else {
    urls.print();
  }
};
