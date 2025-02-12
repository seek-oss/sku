import debug from 'debug';

export const log = debug('sku:bin');

export const initDebug = () => {
  // Enable all sku:* `debug` logs
  // @see https://www.npmjs.com/package/debug
  process.env.DEBUG = `sku:*${`,${process.env.DEBUG}` || ''}`;
  debug.enable(process.env.DEBUG);
};
