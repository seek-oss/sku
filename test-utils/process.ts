import { createRequire } from 'node:module';
import { execa, ExecaError, type Options } from 'execa';

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
  args?: string[],
  options: Options = {},
) => {
  try {
    return await execa(options)(script, args);
  } catch (error) {
    if (error instanceof ExecaError) {
      if (error.isCanceled) {
        console.info(error.originalMessage);
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
  args: string[] = [],
  options?: Options,
) {
  const processOptions: Options = {
    cwd,
    ...options,
    env: {
      ...process.env,
      ...options?.env,
    },
  };

  // When starting a dev server, return a hook to the running process
  if (/^(start|serve)/.test(script)) {
    return run(skuBin, [script, ...args], {
      ...processOptions,
      stdio: 'inherit',
    });
  }

  return run(skuBin, [script, ...args], processOptions);
}

export async function runSkuCodemod(
  codemod: string,
  cwd: string,
  args?: string[],
  options?: Options,
) {
  const processOptions = {
    cwd,
    // Increased from 1024 * 1024 because Storybook can produce very large outputs.
    // https://nodejs.org/docs/latest-v18.x/api/child_process.html#child_process_child_process_exec_command_options_callback
    maxBuffer: 5 * 1024 * 1024,
    ...options,
    env: {
      ...process.env,
      ...options?.env,
    },
  };

  // Otherwise, resolve the promise when the script finishes
  return run(skuCodemodBin, [codemod, ...(args || [])], processOptions);
}
