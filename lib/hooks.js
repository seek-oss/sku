const { SyncHook } = require('tapable');

function createHooks() {
  return {
    babel: new SyncHook(['config'])
  };
}

module.exports = { createHooks };
