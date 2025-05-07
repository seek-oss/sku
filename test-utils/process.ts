import { createRequire } from 'node:module';
import spawn, { type Options, SubprocessError } from 'nano-spawn';

const require = createRequire(import.meta.url);
const skuBin = require.resolve('../packages/sku/bin.js');
const skuCodemodBin = require.resolve('../packages/sku-codemod/bin.js');

export const createCancelSignal = () => {
  const controller = new AbortController();
  return {
    signal: controller.signal,
    cancel: (reason: string = 'Cancelled long-running task') =>
      controller.abort(reason),
  };
};

export const run = async (
  script: string,
  options: Options & { args?: string[] } = {},
) => {
  const { args = [], ...spawnOptions } = options;
  try {
    return await spawn(script, args, spawnOptions);
  } catch (error) {
    if (error instanceof SubprocessError) {
      if (error.cause instanceof Error && error.cause.name === 'AbortError') {
        console.log(error.cause.cause);
        return;
      }
    }

    throw error;
  }
};

type DevServerSkuScripts = 'serve' | 'start' | 'start-ssr' | 'storybook';
type SkuScript =
  | DevServerSkuScripts
  | 'build'
  | 'build-ssr'
  | 'build-storybook'
  | 'configure'
  | 'format'
  | 'init'
  | 'lint'
  | 'test';

export async function runSkuScriptInDir(
  script: SkuScript,
  cwd: string,
  options: Omit<Options, 'cwd'> & { args?: string[] } = {},
) {
  const { args = [], ...spawnOptions } = options;
  const processOptions: Options = {
    cwd,
    ...spawnOptions,
    env: {
      ...process.env,
      ...spawnOptions?.env,
    },
  };

  // When starting a dev server, return a hook to the running process
  if (/^(start|serve)/.test(script)) {
    return run(skuBin, {
      ...processOptions,
      args: [script, ...args],
      stdio: 'inherit',
    });
  }

  return run(skuBin, { ...processOptions, args: [script, ...args] });
}

export async function runSkuCodemod(
  codemod: string,
  cwd: string,
  options: Omit<Options, 'cwd'> & { args?: string[] } = {},
) {
  const { args = [], ...spawnOptions } = options;
  const processOptions = {
    cwd,
    // Increased from 1024 * 1024 because Storybook can produce very large outputs.
    // https://nodejs.org/docs/latest-v18.x/api/child_process.html#child_process_child_process_exec_command_options_callback
    maxBuffer: 5 * 1024 * 1024,
    ...spawnOptions,
    env: {
      ...process.env,
      ...spawnOptions?.env,
    },
  };

  // Otherwise, resolve the promise when the script finishes
  return run(skuCodemodBin, {
    args: [codemod, ...args],
    ...processOptions,
  });
}
