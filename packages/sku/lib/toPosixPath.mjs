// @ts-check
import path from 'node:path';

/**
 * Replaces all win32 path separators (\) with posix path separators (/)
 * @param {string} inputPath
 */
const toPosixPath = (inputPath) =>
  inputPath.replaceAll(path.win32.sep, path.posix.sep);

export default toPosixPath;
