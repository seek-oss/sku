const util = require('util');
const spawn = util.promisify(require('child_process').spawn);

const skuBin = `${__dirname}/../packages/sku/bin/sku.js`;

const spawnSkuScriptInDir = (script, cwd, args = [], options = {}) => {
  const childPromise = spawn(skuBin, [script, ...args], {
    stdio: 'ignore',
    cwd,
    env: process.env,
    maxBuffer: 1024 * 1024,
    ...options,
  });

  return childPromise;
};

module.exports = { spawnSkuScriptInDir };
