import type { SkuContext } from '@/context/createSkuContext.js';
import { getAppHosts } from '@/utils/contextUtils/hosts.js';
import basicSsl from '@vitejs/plugin-basic-ssl';
import path from 'node:path';

export const skuViteHttpsDevServer = (skuContext: SkuContext) => {
  if (skuContext.httpsDevServer) {
    const certDir = path.join(process.cwd(), '.ssl');

    return basicSsl({
      domains: getAppHosts(skuContext).filter((host) => host !== undefined),
      certDir,
    });
  }

  return null;
};
