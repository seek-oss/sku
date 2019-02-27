const gracefulSpawn = require('../../lib/gracefulSpawn');
const { exec } = require('child-process-promise');

const skuBin = `${__dirname}/../../bin/sku.js`;

module.exports = async (script, cwd, args = []) => {
  // When starting a dev server, return a hook to the running process
  if (/^(start|storybook)/.test(script)) {
    return gracefulSpawn(skuBin, [script, ...args], { stdio: 'inherit', cwd });
  }

  // Otherwise, resolve the promise when the script finishes
  try {
    return await exec(`${skuBin} ${script} ${args.join(' ')}`, {
      stdio: 'inherit',
      cwd,
      env: process.env,
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
