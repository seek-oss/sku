const spawn = require('./gracefulSpawn');
const { exec } = require('child-process-promise');

const skuBin = `${__dirname}/../../bin/sku.js`;

module.exports = async (script, cwd) => {
  // When starting a dev server, return a hook to the running process
  if (/^start/.test(script)) {
    return spawn(skuBin, [script], { stdio: 'inherit', cwd });
  }

  // Otherwise, resolve the promise when the script finishes
  return await exec(`${skuBin} ${script}`, { stdio: 'inherit', cwd });
};
