import { createRequire } from 'node:module';
import { execa, ExecaError, type Options } from 'execa';

const require = createRequire(import.meta.url);
const skuBin = require.resolve('../packages/sku/bin.js');

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
      nodeOptions: ['--max-old-space-size=2048'],
      stdio: 'inherit',
    });
  }

  return run(skuBin, [script, ...args], processOptions);
}
