const { promisify } = require('util');
// spwan can't be promisify'ed so we use execFile, which just wraps spawn and can be promisify'ed
// https://github.com/nodejs/node/blob/2f369ccacfb60c034de806f24164524910301825/lib/child_process.js#L326
const execFile = promisify(require('child_process').execFile);
const gracefulSpawn = require('sku/lib/gracefulSpawn');

const skuBin = require.resolve('sku/bin/sku.js');

/**
 * @param {string} file The name or path of the executable file to run
 * @param {string[]} [args] List of string arguments
 * @param {import('child_process').ExecFileOptions} [options] Process execution options
 * @return {Promise<{ stdout: string; stderr: string; child: import('child_process').ChildProcess }>}
 */
const run = async (file, args = [], options = {}) => {
  try {
    const promise = execFile(file, args, {
      env: process.env,
      ...options,
    });
    // Yes, this is a bit odd.
    // If we don't spread the promise the child process is not returned, only stdout and stderr.
    const result = await promise;
    return { ...promise, ...result };
  } catch (error) {
    // print the stdout of a failed command so we can see it in the Jest output
    if (error.stdout) {
      console.warn(error.stdout);
    }
    if (error.stderr) {
      console.warn(error.stderr);
    }
    throw error;
  }
};

/**
 * @param {string} script The sku script to run
 * @param {string} cwd The current working directory of the child process
 * @param {string[]} [args] List of string arguments
 * @param {import('child_process').ExecFileOptions | import('child_process').SpawnOptions} [options] Process execution options
 */
const runSkuScriptInDir = async (script, cwd, args = [], options = {}) => {
  const processOptions = {
    cwd,
    env: {
      ...process.env,
      STORYBOOK_DISABLE_TELEMETRY: 1,
    },
    // Increased from 1024 * 1024 because Storybook can produce very large outputs.
    // https://nodejs.org/docs/latest-v18.x/api/child_process.html#child_process_child_process_exec_command_options_callback
    maxBuffer: 5 * 1024 * 1024,
    ...options,
  };

  // When starting a dev server, return a hook to the running process
  if (/^(start|storybook|serve)/.test(script)) {
    return gracefulSpawn(skuBin, [script, ...args], {
      stdio: 'inherit',
      ...processOptions,
    });
  }

  // Otherwise, resolve the promise when the script finishes
  return run(skuBin, [script, ...args], processOptions);
};

module.exports = {
  run,
  runSkuScriptInDir,
};
