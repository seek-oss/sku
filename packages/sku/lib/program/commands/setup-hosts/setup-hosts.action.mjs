import { setupHosts } from '../../../hosts.js';
import { count, close } from '../../../../telemetry/index.js';

export const setupHostsAction = async () => {
  try {
    await setupHosts();
    count('setup_hosts', { status: 'success' });
  } catch {
    count('setup_hosts', { status: 'failed' });

    process.exitCode = 1;
  } finally {
    await close();
  }
};
