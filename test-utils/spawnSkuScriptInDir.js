const util = require('util');
// spwan can't be promisify'ed so we use execFile, which just wraps spawn and can be promisify'ed
// https://github.com/nodejs/node/blob/2f369ccacfb60c034de806f24164524910301825/lib/child_process.js#L326
const spawn = util.promisify(require('child_process').execFile);

const skuBin = require.resolve('sku/bin/sku.js');

const spawnSkuScriptInDir = async (script, cwd, args = [], options = {}) => {
  const promise = spawn(skuBin, [script, ...args], {
    stdio: 'ignore',
    cwd,
    env: process.env,
    ...options,
  });
  await promise;

  return { ...promise };
};

module.exports = { spawnSkuScriptInDir };
