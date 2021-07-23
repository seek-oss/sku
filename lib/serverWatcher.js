const onDeath = require('death');
const debug = require('debug')('sku:server-watcher');
const cluster = require('cluster');
const { SIGKILL } = require('constants');

const pluginName = 'sku-server-watcher';

function createServerManager(serverFilePath) {
  let currentWorker;

  cluster.setupMaster({
    exec: serverFilePath,
    silent: false,
  });

  const killIfNotDead = () => {
    if (
      currentWorker &&
      currentWorker.isConnected() &&
      !currentWorker.isDead()
    ) {
      debug('Ending server worker');
      currentWorker.kill(SIGKILL);
      currentWorker = null;
    }
  };

  const start = () => {
    killIfNotDead();

    debug('Starting server worker');
    const worker = cluster.fork();

    worker.on('exit', (code, signal) => {
      currentWorker = null;
      if (code) {
        console.error('Server worker exited unexpectedly:', { code, signal });
      }
    });

    worker.on('online', () => {
      debug(`Server worker online. ID: %s`, worker.id);
      currentWorker = worker;
    });
  };

  return { start, kill: killIfNotDead };
}

function serverWatcher(compiler, serverFilePath) {
  const serverManager = createServerManager(serverFilePath);

  compiler.hooks.done.tap(pluginName, () => {
    serverManager.start();
  });

  compiler.hooks.watchClose.tap(pluginName, () => {
    serverManager.kill();
  });

  onDeath(() => {
    serverManager.kill();
  });
}

module.exports = serverWatcher;

// Original cross-spawn impl
// function createServerManager(serverFilePath) {
//   let childProcess;

//   return {
//     start: () => {
//       if (childProcess && !childProcess.killed) {
//         childProcess.kill();
//       }

//       debug('Starting server process');
//       childProcess = spawn('node', [serverFilePath], { stdio: 'inherit' });
//     },
//     kill: () => {
//       if (childProcess) {
//         debug('Ending server process');
//         childProcess.kill();
//       }
//     },
//   };
// }
