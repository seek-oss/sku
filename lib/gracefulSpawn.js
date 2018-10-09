const spawn = require('cross-spawn');
const onDeath = require('death');

module.exports = (...args) => {
  const childProcess = spawn(...args);

  onDeath(signal => {
    childProcess.kill(signal);
  });

  return childProcess;
};
