// @ts-check
const debug = require('debug');

const log = debug('sku:bin');

const initDebug = () => {
  // Enable all sku:* `debug` logs
  // @see https://www.npmjs.com/package/debug
  process.env.DEBUG = `sku:*${`,${process.env.DEBUG}` || ''}`;
  debug.enable(process.env.DEBUG);
};

module.exports = {
  log,
  initDebug,
};
