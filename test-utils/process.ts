import { promisify } from 'node:util';
// spawn can't be promisified so we use execFile, which just wraps spawn and can be promisifyied
// https://github.com/nodejs/node/blob/2f369ccacfb60c034de806f24164524910301825/lib/child_process.js#L326
import {
  execFile as _execFile,
  type SpawnOptions,
  type ChildProcess,
  type ExecFileOptions,
} from 'node:child_process';
import gracefulSpawn from 'sku/lib/gracefulSpawn';

const execFile = promisify(_execFile);
const skuBin = require.resolve('sku/bin/sku.js');

export const run = async (
  file: string,
  args: string[] = [],
  options: ExecFileOptions = {},
) => {
  try {
    const promise = execFile(file, args, {
      env: process.env,
      ...options,
    });
    // The child process is available synchronously, but stdout and stderr are resolved asynchronously
    const { child } = promise;
    const result = await promise;

    return { child, ...result };
  } catch (error) {
    // asserting `error instanceof Error` doesn't work here for some reason
    const { stdout, stderr } = error as Error & {
      stdout: string;
      stderr: string;
    };

    // print the stdout of a failed command so we can see it in the Jest output
    if (stdout) {
      console.warn(stdout);
    }
    if (stderr) {
      console.warn(stderr);
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
  script: DevServerSkuScripts,
  cwd: string,
  args?: string[],
  options?: SpawnOptions,
): Promise<ReturnType<typeof gracefulSpawn>>;
export async function runSkuScriptInDir(
  script: Exclude<SkuScript, DevServerSkuScripts>,
  cwd: string,
  args?: string[],
  options?: SpawnOptions,
): Promise<{ stdout: string; stderr: string; child: ChildProcess }>;
export async function runSkuScriptInDir(
  script: SkuScript,
  cwd: string,
  args?: string[],
  options?: SpawnOptions,
): Promise<
  ChildProcess | { stdout: string; stderr: string; child: ChildProcess }
> {
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

  // When starting a dev server, return a hook to the running process
  if (/^(start|storybook|serve)/.test(script)) {
    return gracefulSpawn(skuBin, [script, ...(args || [])], {
      stdio: 'inherit',
      ...processOptions,
    });
  }

  // Otherwise, resolve the promise when the script finishes
  return run(skuBin, [script, ...(args || [])], processOptions);
}
