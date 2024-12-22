import { setupHosts } from '@/utils/contextUtils/hosts.js';
import provider from '../../../telemetry/index.js';
import { SkuContext } from '@/context/createSkuContext.js';

export const setupHostsAction = async ({
  skuContext,
}: {
  skuContext: SkuContext;
}) => {
  try {
    await setupHosts(skuContext);
    provider.count('setup_hosts', { status: 'success' });
  } catch {
    provider.count('setup_hosts', { status: 'failed' });

    process.exitCode = 1;
  } finally {
    await provider.close();
  }
};
