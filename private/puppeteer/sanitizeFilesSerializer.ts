import type { SnapshotSerializer } from 'vitest';
import { sanitizeString } from './sanitizeString.ts';

/** Formats CSS strings */
export const sanitizeFilesSerializer = {
  serialize(val: string, config, indentation, depth, refs, printer) {
    // Runs the default serializer on the sanitized value
    return printer(
      sanitizeString(val),
      { ...config, plugins: [] },
      indentation,
      depth,
      refs,
    );
  },

  test: (value) => value && typeof value === 'string',
} satisfies SnapshotSerializer;
