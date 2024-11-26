const program = require('../program');
const debug = require('debug');

const log = debug('sku:bin');

if (program.opts()?.debug) {
  // Enable all sku:* `debug` logs
  // @see https://www.npmjs.com/package/debug
  process.env.DEBUG = `sku:*${`,${process.env.DEBUG}` || ''}`;
  debug.enable(process.env.DEBUG);
}

module.exports = {
  log,
};
