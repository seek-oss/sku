import { access } from 'node:fs/promises';
import type { PathLike } from 'node:fs';

/**
 * Convenience wrapper for fs.access that returns `true` if the access check was successful and `false` otherwise
 */
const exists = async (path: PathLike) => {
  try {
    await access(path);

    return true;
  } catch {
    return false;
  }
};

export default exists;
