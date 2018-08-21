const { spawn } = require('child_process');
const onDeath = require('death');

module.exports = (...args) => {
  const childProcess = spawn(...args);

  onDeath((signal, error) => {
    console.error(
      `Killing child process (${args[0]}). Recieved Signal ${signal}:${error}`
    );
    childProcess.kill();
  });

  return childProcess;
};
