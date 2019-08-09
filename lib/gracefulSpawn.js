const { promisify } = require('util');
const spawn = require('cross-spawn');
const treeKillAsync = promisify(require('tree-kill'));
const onDeath = require('death');

module.exports = (...args) => {
  const childProcess = spawn(...args);

  childProcess.kill = async signal => {
    await treeKillAsync(childProcess.pid, signal);

    // Needs a bit more time, for some reason :(
    // If we don't give it a bit of breathing room,
    // Jest complains about handles being left open.
    await new Promise(resolve => setTimeout(resolve, 100));
  };

  onDeath(signal => {
    childProcess.kill(signal);
  });

  return childProcess;
};
