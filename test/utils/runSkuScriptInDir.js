const gracefulSpawn = require('../../lib/gracefulSpawn');
const { exec } = require('child-process-promise');
const debug = require('debug');

const skuBin = `${__dirname}/../../bin/sku.js`;
const log = debug('sku:runSkuScriptInDir');

module.exports = async (script, cwd, args = []) => {
  log(script, cwd, args, skuBin);
  // When starting a dev server, return a hook to the running process
  if (/^(start|storybook|serve)/.test(script)) {
    return gracefulSpawn(skuBin, [script, ...args], { stdio: 'inherit', cwd });
  }

  // Otherwise, resolve the promise when the script finishes
  try {
    return await exec(`${skuBin} ${script} ${args.join(' ')}`, {
      stdio: 'inherit',
      cwd,
      env: process.env,
      // Elevates the buffer limit assigned to the child process.
      // This limit is set to `200 * 1024` in node v10 and being
      // elevated to `1024 * 1024` in node v12.
      //
      // See node v10: https://nodejs.org/docs/latest-v10.x/api/child_process.html#child_process_child_process_exec_command_options_callback
      // See node v12: https://nodejs.org/docs/latest-v12.x/api/child_process.html#child_process_child_process_exec_command_options_callback
      maxBuffer: 1024 * 1024,
    });
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
