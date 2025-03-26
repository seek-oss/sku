import { setupHosts, withHostile } from '@/utils/contextUtils/hosts.js';
import provider from '@/services/telemetry/index.js';
import type { SkuContext } from '@/context/createSkuContext.js';

const setupHostsWithHostile = withHostile(setupHosts);

export const setupHostsAction = async ({
  skuContext,
}: {
  skuContext: SkuContext;
}) => {
  try {
    await setupHostsWithHostile(skuContext);
    provider.count('setup_hosts', { status: 'success' });
  } catch {
    provider.count('setup_hosts', { status: 'failed' });

    process.exitCode = 1;
  } finally {
    await provider.close();
  }
};
