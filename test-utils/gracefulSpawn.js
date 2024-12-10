import { promisify } from 'node:util';
import spawn from 'cross-spawn';
import treeKill from 'tree-kill';
import onDeath from 'death';

const treeKillAsync = promisify(treeKill);

export const gracefulSpawn = (...args) => {
  try {
    const childProcess = spawn(...args);

    childProcess.kill = async (signal) => {
      await treeKillAsync(childProcess.pid, signal);

      // Needs a bit more time, for some reason :(
      // If we don't give it a bit of breathing room,
      // Jest complains about handles being left open.
      await new Promise((resolve) => setTimeout(resolve, 100));
    };

    onDeath((signal) => {
      childProcess.kill(signal);
    });

    return childProcess;
  } catch (e) {
    console.log('cross spawn issue', e);
  }
};
