import { createDebug, enable } from 'obug';

export const log = createDebug('sku:bin');

export const initDebug = () => {
  // Enable all sku:* `obug` logs
  // @see https://www.npmjs.com/package/obug
  process.env.DEBUG = `sku:*${`,${process.env.DEBUG}` || ''}`;
  enable(process.env.DEBUG);
};
