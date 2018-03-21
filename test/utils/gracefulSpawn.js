const { spawn } = require('child_process');
const onDeath = require('death');

module.exports = (...args) => {
  const childProcess = spawn(...args);
  
  onDeath(() => {
    childProcess.kill();
  });

  return childProcess;
};
