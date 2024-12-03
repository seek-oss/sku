// @ts-check
import path from 'node:path';
import spawn from 'cross-spawn';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

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

  return import.meta.resolve(path.join(packageName, binPath));
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
export const runBin = ({ packageName, binName, args, options }) =>
  spawnPromise(resolveBin(packageName, binName), args, options);

/**
 * @param {Options} options
 */
export const startBin = ({ packageName, binName, args, options }) => {
  const childProcess = spawn(resolveBin(packageName, binName), args, options);

  return childProcess;
};
