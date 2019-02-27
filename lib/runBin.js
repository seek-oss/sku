const path = require('path');
const spawn = require('cross-spawn');

const resolveBin = (packageName, binName) => {
  const packageJson = require(`${packageName}/package.json`);
  const binPath =
    typeof packageJson.bin === 'string'
      ? packageJson.bin
      : packageJson.bin[binName || packageName];

  return require.resolve(path.join(packageName, binPath));
};

const spawnPromise = (commandPath, args, options) => {
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

const runBin = ({ packageName, binName, args, options }) =>
  spawnPromise(resolveBin(packageName, binName), args, options);

const startBin = ({ packageName, binName, args, options }) => {
  const childProcess = spawn(resolveBin(packageName, binName), args, options);

  return childProcess;
};

module.exports = {
  runBin,
  startBin,
};
