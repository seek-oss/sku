// @ts-check
const { format } = require('@prettier/sync');
const { parse } = require('css');

const cssSnapshotSerializer = {
  /** @param {string} value */
  print: (value) => format(value, { parser: 'css' }),
  /** @param {string} value */
  test: (value) => {
    try {
      parse(value);
    } catch {
      return false;
    }
    return true;
  },
};

module.exports = cssSnapshotSerializer;
