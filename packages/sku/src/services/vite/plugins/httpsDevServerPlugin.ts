import type { SkuContext } from '@/context/createSkuContext.js';
import { getAppHosts } from '@/utils/contextUtils/hosts.js';
import basicSsl from '@vitejs/plugin-basic-ssl';
import path from 'node:path';
import type { Plugin } from 'vite';

/**
 * Force HTTP/1.1 for the dev server. This is needed for proxy middleware that does not support HTTP/2.
 */
const forceHttp1 = (): Plugin => ({
  name: 'sku:force-http1',
  config: () => ({
    server: {
      proxy: {},
    },
  }),
});

export const httpsDevServerPlugin = (skuContext: SkuContext): Plugin[] => {
  if (!skuContext.httpsDevServer) {
    return [];
  }
  const certDir = path.join(process.cwd(), '.ssl');

  return [
    forceHttp1(),
    basicSsl({
      domains: getAppHosts(skuContext).filter((host) => host !== undefined),
      certDir,
    }),
  ];
};
