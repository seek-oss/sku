import { setupHosts } from '../../../hosts.js';
import provider from '../../../../telemetry/index.js';

export const setupHostsAction = async () => {
  try {
    await setupHosts();
    provider.count('setup_hosts', { status: 'success' });
  } catch {
    provider.count('setup_hosts', { status: 'failed' });

    process.exitCode = 1;
  } finally {
    await provider.close();
  }
};
