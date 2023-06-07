// @ts-check
const path = require('path');

/**
 * Replaces all win32 path separators (\) with posix path separators (/)
 * @param {string} inputPath
 */
const toPosixPath = (inputPath) =>
  inputPath.split(path.win32.sep).join(path.posix.sep);

module.exports = toPosixPath;
