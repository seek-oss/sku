import { setupHosts } from '../../../hosts.js';
import track from '../../../../telemetry/index.js';

export const setupHostsAction = async () => {
  try {
    await setupHosts();
    track.count('setup_hosts', { status: 'success' });
  } catch {
    track.count('setup_hosts', { status: 'failed' });

    process.exitCode = 1;
  } finally {
    await track.close();
  }
};
