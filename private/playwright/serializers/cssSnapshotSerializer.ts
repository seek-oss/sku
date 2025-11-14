import prettier from '@prettier/sync';
import { parse } from 'css';
import type { SnapshotSerializer } from 'vitest';

/** Formats CSS strings */
export const cssSnapshotSerializer: SnapshotSerializer = {
  print: (value) => {
    if (typeof value !== 'string') {
      throw new Error(
        `cssSnapshotSerializer expected a string, received ${typeof value}`,
      );
    }

    return prettier.format(value, { parser: 'css' });
  },
  test: (value) => {
    try {
      parse(value);
    } catch {
      return false;
    }

    return true;
  },
};
