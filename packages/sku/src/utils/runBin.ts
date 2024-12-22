import path from 'node:path';
import spawn from 'cross-spawn';
import { createRequire } from 'node:module';
import type { SpawnOptions } from 'node:child_process';

const require = createRequire(import.meta.url);

const resolveBin = (packageName: string, binName: string | undefined) => {
  const packageJson = require(`${packageName}/package.json`);
  const binPath =
    typeof packageJson.bin === 'string'
      ? packageJson.bin
      : packageJson.bin[binName || packageName];

  return require.resolve(path.join(packageName, binPath));
};

const spawnPromise = (
  commandPath: string,
  args: string[] | undefined,
  options: SpawnOptions | undefined,
) => {
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

type Options = {
  packageName: string;
  binName?: string;
  args?: string[];
  options?: SpawnOptions;
};

export const runBin = ({ packageName, binName, args, options }: Options) =>
  spawnPromise(resolveBin(packageName, binName), args, options);

export const startBin = ({ packageName, binName, args, options }: Options) => {
  const childProcess = spawn(resolveBin(packageName, binName), args, options);

  return childProcess;
};
