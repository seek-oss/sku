import type { SkuContext } from '../../../context/createSkuContext.js';
import { getAppHosts } from '../../../context/hosts.js';
import basicSsl from '@vitejs/plugin-basic-ssl';
import path from 'node:path';
import type { Plugin } from 'vite';

export const httpsDevServerPlugin = (skuContext: SkuContext): Plugin[] => {
  if (!skuContext.httpsDevServer) {
    return [];
  }
  const certDir = path.join(process.cwd(), '.ssl');

  return [
    basicSsl({
      domains: getAppHosts(skuContext).filter((host) => host !== undefined),
      certDir,
    }),
  ];
};
