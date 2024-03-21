const { statSync, readdirSync } = require('node:fs');

/**
 * Returns whether the given directory is empty, throwing if the path is not a directory
 * @typedef {import('fs').PathLike} PathLike
 * @param {PathLike} path A path to a directory
 */
const isEmptyDir = (path) => {
  const isDirectory = statSync(path).isDirectory();

  if (!isDirectory) {
    throw new Error(`${path} is not a directory`);
  }

  const files = readdirSync(path);

  return files.length === 0;
};

module.exports = { isEmptyDir };
