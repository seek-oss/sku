const { setupHosts } = require('../lib/hosts');

(async () => {
  try {
    await setupHosts();
  } catch (e) {
    process.exit(1);
  }
})();
