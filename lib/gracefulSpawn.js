const spawn = require('cross-spawn');
const treeKill = require('tree-kill');
const onDeath = require('death');

module.exports = (...args) => {
  const childProcess = spawn(...args);

  childProcess.kill = signal => treeKill(childProcess.pid, signal);

  onDeath(signal => {
    childProcess.kill(signal);
  });

  return childProcess;
};
