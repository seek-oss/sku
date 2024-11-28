// @ts-check
const { prependWithManagedConfigBanner } = require('./managedConfigBanner');
const { writeFile } = require('node:fs/promises');

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

/**
 * Write the provided `content` to the file at `fileName` in the current working directory.
 *  If `content` is an object, it will be stringified.
 *
 * Optionally prepend the content with the managed config banner.
 *
 * @param {string} fileName
 * @param {string | Record<string, unknown>} content
 * @param {{ banner?: boolean }} [options]
 */
const writeFileToCWD = async (fileName, content, { banner = true } = {}) => {
  const outPath = getPathFromCwd(fileName);
  const str =
    typeof content === 'string' ? content : JSON.stringify(content, null, 2);
  const contentStr = banner ? prependWithManagedConfigBanner(str) : str;

  await writeFile(outPath, contentStr);
};

module.exports = {
  cwd,
  setCwd,
  getPathFromCwd,
  requireFromCwd,
  writeFileToCWD,
};
