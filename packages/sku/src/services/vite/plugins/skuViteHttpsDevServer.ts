import type { SkuContext } from '@/context/createSkuContext.js';
import { getAppHosts } from '@/utils/contextUtils/hosts.js';
import basicSsl from '@vitejs/plugin-basic-ssl';
import path from 'node:path';
import type { Plugin } from 'vite';
import { promises as fs } from 'node:fs';
import debug from 'debug';
import { hasErrorCode } from '@/utils/error-guards.js';

const log = debug('sku:vite:https');

/**
 * Cleans up stale certs from the cert directory. This is useful when the user changes their hosts in their sku config and the old certs are no longer needed.
 */
const cleanupStaleCerts = (certDir: string): Plugin => ({
  name: 'sku:cleanup-stale-certs',
  // We want to call this before the ssl generation which happens in the "configResolved" hook. However, adding a "enfore:pre" flag in "configResolved"
  // doesn't guarantee that it will delete the certs before the ssl generation since it's called async and in parallel.
  // So, we use the "config" hook which is guaranteed to be called and waited on before the "configResolved" hook.
  config: {
    async handler() {
      try {
        await fs.rm(certDir, { recursive: true });
        log(`Removed stale certs from ${certDir}`);
      } catch (e) {
        if (hasErrorCode(e) && e.code === 'ENOENT') {
          log(`Failed removing stale certs. Directory not found: ${certDir}`);
          return;
        }

        log(`Failed to remove stale certs from ${certDir}`, e);
      }
    },
  },
});

export const skuViteHttpsDevServer = async (skuContext: SkuContext) => {
  const certDir = path.join(process.cwd(), '.ssl');

  return [
    cleanupStaleCerts(certDir),
    basicSsl({
      domains: getAppHosts(skuContext).filter((host) => host !== undefined),
      certDir,
    }),
  ];
};
