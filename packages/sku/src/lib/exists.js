// @ts-check
import { access } from 'node:fs/promises';

/**
 * Convenience wrapper for fs.access that returns `true` if the access check was successful and `false` otherwise
 * @typedef {import('fs').PathLike} PathLike
 * @param {PathLike} path A path to a file or directory
 */
const exists = async (path) => {
  try {
    await access(path);

    return true;
  } catch {
    return false;
  }
};

export default exists;
