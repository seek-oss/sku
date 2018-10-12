const spawn = require('cross-spawn');

module.exports = (commandPath, args, options) => {
  const childProcess = spawn(commandPath, args, options);

  return new Promise((resolve, reject) => {
    childProcess.on('exit', exitCode => {
      if (exitCode === 0) {
        resolve(exitCode);
        return;
      }
      reject(exitCode);
    });
  });
};
