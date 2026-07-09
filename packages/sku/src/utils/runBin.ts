import path from 'node:path';
import { x } from 'tinyexec';
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

const spawnPromise = async (
  commandPath: string,
  args: string[] | undefined,
  options: SpawnOptions | undefined,
) => {
  const { exitCode } = await x(commandPath, args, {
    nodeOptions: options,
  });

  return {
    exitCode,
  };
};

type Options = {
  packageName: string;
  binName?: string;
  args?: string[];
  options?: SpawnOptions;
};

export const runBin = ({ packageName, binName, args, options }: Options) =>
  spawnPromise(resolveBin(packageName, binName), args, options);
