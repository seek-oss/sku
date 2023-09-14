const path = require('node:path');

let currentCwd = process.cwd();

/**
 * If you are setting cwd in your script
 * it must be called first, including any requires.
 * This issue will be resolved in a future release.
 *
 * @param {string} newCwd
 */
const setCwd = (newCwd) => {
  if (newCwd) {
    currentCwd = newCwd;
  }
};

const cwd = () => currentCwd;

/**
 * @param {string} filePath
 */
const getPathFromCwd = (filePath) => path.join(currentCwd, filePath);

/**
 * @param {string} modulePath
 */
const requireFromCwd = (modulePath) =>
  require(require.resolve(modulePath, { paths: [cwd()] }));

module.exports = {
  cwd,
  setCwd,
  getPathFromCwd,
  requireFromCwd,
};
