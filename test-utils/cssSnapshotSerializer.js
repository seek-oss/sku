// @ts-check
import { format } from 'prettier';
import { parse } from 'css';

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

export default cssSnapshotSerializer;
