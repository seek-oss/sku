const debug = require('debug')('sku:server-watcher');
const cluster = require('cluster');

function createServerManager(serverFilePath) {
  cluster.setupMaster({
    exec: serverFilePath,
    silent: false,
  });

  const killIfNotDead = () => {
    // eslint-disable-next-line guard-for-in
    for (const id in cluster.workers) {
      if (cluster.workers[id].isConnected() && !cluster.workers[id].isDead()) {
        debug('Killing server worker: %s', id);
        cluster.workers[id].kill();
      }
    }
  };

  const start = () => {
    killIfNotDead();

    const activeWorkerCount = Object.values(cluster.workers).filter(
      (w) => !w.isDead(),
    ).length;
    debug(`Starting server worker. Active workers: %s`, activeWorkerCount);

    const worker = cluster.fork();

    worker.on('exit', (code, signal) => {
      if (code) {
        console.error('Server worker exited unexpectedly:', { code, signal });
      } else {
        debug('Worker exitted gracefully: %s', worker.id);
      }
    });

    worker.on('online', () => {
      debug(`Server worker online %s`, worker.id);
    });
  };

  return { start, kill: killIfNotDead };
}

module.exports = createServerManager;
