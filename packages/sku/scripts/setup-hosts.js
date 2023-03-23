const { setupHosts } = require('../lib/hosts');
const track = require('../telemetry');

(async () => {
  try {
    await setupHosts();
    track.count('setup_hosts', { status: 'success' });
  } catch (e) {
    track.count('setup_hosts', { status: 'failed' });

    process.exitCode = 1;
  } finally {
    await track.close();
  }
})();
