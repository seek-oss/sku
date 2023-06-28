const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const gracefulSpawn = require('../packages/sku/lib/gracefulSpawn');

const skuBin = path.resolve(__dirname, '../packages/sku/bin/sku.js');

const runSkuScriptInDir = async (script, cwd, args = []) => {
  // When starting a dev server, return a hook to the running process
  if (/^(start|storybook|serve)/.test(script)) {
    return gracefulSpawn(skuBin, [script, ...args], {
      stdio: 'inherit',
      cwd,
      env: {
        ...process.env,
        STORYBOOK_DISABLE_TELEMETRY: 1,
      },
    });
  }

  // Otherwise, resolve the promise when the script finishes
  try {
    const promise = exec(`${skuBin} ${script} ${args.join(' ')}`, {
      stdio: 'inherit',
      cwd,
      env: process.env,
      // Increased from 1024 * 1024 because Storybook can produce very large outputs.
      // https://nodejs.org/docs/latest-v18.x/api/child_process.html#child_process_child_process_exec_command_options_callback
      maxBuffer: 5 * 1024 * 1024,
    });
    await promise;
    return { ...promise };
  } catch (error) {
    // Print the stdout of a failed command so we can see it in the jest output.
    if (error.stdout) {
      console.warn(error.stdout);
    }
    if (error.stderr) {
      console.warn(error.stderr);
    }
    throw error;
  }
};
module.exports = { runSkuScriptInDir };
