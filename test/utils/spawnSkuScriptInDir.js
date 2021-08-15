const { spawn } = require('child-process-promise');

const skuBin = `${__dirname}/../../bin/sku.js`;

module.exports = (script, cwd, args = [], options = {}) => {
  const childPromise = spawn(skuBin, [script, ...args], {
    stdio: 'ignore',
    cwd,
    env: process.env,
    // Elevates the buffer limit assigned to the child process.
    // This limit is set to `200 * 1024` in node v10 and being
    // elevated to `1024 * 1024` in node v12.
    //
    // See node v10: https://nodejs.org/docs/latest-v10.x/api/child_process.html#child_process_child_process_exec_command_options_callback
    // See node v12: https://nodejs.org/docs/latest-v12.x/api/child_process.html#child_process_child_process_exec_command_options_callback
    maxBuffer: 1024 * 1024,
    ...options,
  });

  return childPromise;
};
