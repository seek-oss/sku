import debug from 'debug';
import cluster, { type Worker } from 'node:cluster';

const log = debug('sku:server-watcher');

function createServerManager(serverFilePath: string) {
  let activeWorker: Worker;
  cluster.setupMaster({
    exec: serverFilePath,
    silent: false,
  });

  const killIfNotDead = () => {
    for (const id in cluster.workers) {
      if (
        cluster?.workers?.[id]?.isConnected() &&
        !cluster.workers[id].isDead()
      ) {
        log('Killing server worker: %s', id);
        cluster.workers[id].kill();
      }
    }
  };

  const start = () => {
    killIfNotDead();

    if (cluster.workers) {
      const activeWorkerCount = Object.values(cluster?.workers).filter(
        (w) => !w?.isDead(),
      ).length;
      log(`Starting server worker. Active workers: %s`, activeWorkerCount);
    }
    const worker = cluster.fork();

    worker.on('exit', (code, signal) => {
      if (code) {
        console.error('Server worker exited unexpectedly:', { code, signal });
      } else {
        log('Worker exitted gracefully: %s', worker.id);
      }
    });

    worker.on('online', () => {
      log(`Server worker online %s`, worker.id);
    });

    activeWorker = worker;
  };

  const hotUpdate = () => {
    if (activeWorker) {
      log('Sending hot update message to worker');
      activeWorker.send('Start hot update');
    } else {
      log(`Can't send hot update message as there is no active worker`);
    }
  };

  return { start, hotUpdate, kill: killIfNotDead };
}

export default createServerManager;
