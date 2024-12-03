import debug from 'debug';
import cluster from 'node:cluster';

debug('sku:server-watcher');

/**
 * @param {string} serverFilePath
 */
function createServerManager(serverFilePath) {
  let activeWorker;
  cluster.setupMaster({
    exec: serverFilePath,
    silent: false,
  });

  const killIfNotDead = () => {
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

    activeWorker = worker;
  };

  const hotUpdate = () => {
    if (activeWorker) {
      debug('Sending hot update message to worker');
      activeWorker.send('Start hot update');
    } else {
      debug(`Can't send hot update message as there is no active worker`);
    }
  };

  return { start, hotUpdate, kill: killIfNotDead };
}

export default createServerManager;
