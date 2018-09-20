const spawn = require('./gracefulSpawn');
const { exec } = require('child-process-promise');

const skuBin = `${__dirname}/../../bin/sku.js`;

module.exports = async (script, cwd) => {
  // When starting a dev server, return a hook to the running process
  if (/^start/.test(script)) {
    return spawn(skuBin, [script], { stdio: 'inherit', cwd });
  }

  // Otherwise, resolve the promise when the script finishes
  try {
    return await exec(`${skuBin} ${script}`, {
      stdio: 'inherit',
      cwd,
      env: { ...process.env, CI: 'true' }
    });
  } catch (error) {
    // Print the stdout of a failed command so we can see it in the jest output.
    console.log(error.stdout);
    throw error;
  }
};
