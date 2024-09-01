// @ts-check
const path = require('node:path');
const spawn = require('cross-spawn');

/**
 * @param {string} packageName
 * @param {string | undefined} binName
 */
const resolveBin = (packageName, binName) => {
  const packageJson = require(`${packageName}/package.json`);
  const binPath =
    typeof packageJson.bin === 'string'
      ? packageJson.bin
      : packageJson.bin[binName || packageName];

  return require.resolve(path.join(packageName, binPath));
};

/** @typedef {import('child_process').SpawnOptions} SpawnOptions */

/**
 * @param {string} commandPath
 * @param {string[] | undefined} args
 * @param {SpawnOptions | undefined} options
 */
const spawnPromise = (commandPath, args, options) => {
  const childProcess = spawn(commandPath, args, options);

  return new Promise((resolve, reject) => {
    childProcess.on('exit', (exitCode) => {
      if (exitCode === 0) {
        resolve(exitCode);
        return;
      }
      reject(exitCode);
    });
  });
};

/**
 * @typedef Options
 * @property {string} packageName
 * @property {string | undefined} [binName]
 * @property {string[] | undefined} args
 * @property {SpawnOptions | undefined} options
 */

/**
 * @param {Options} options
 */
const runBin = ({ packageName, binName, args, options }) =>
  spawnPromise(resolveBin(packageName, binName), args, options);

/**
 * @param {Options} options
 */
const startBin = ({ packageName, binName, args, options }) => {
  const childProcess = spawn(resolveBin(packageName, binName), args, options);

  return childProcess;
};

module.exports = {
  runBin,
  startBin,
};
