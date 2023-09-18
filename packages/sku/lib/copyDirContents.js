const path = require('node:path');
const fs = require('node:fs/promises');
const exists = require('./exists');

/**
 * Recursively copy the contents of a directory into another directory
 * If the desitnation directory does not already exist, it will be created
 *
 * @typedef {import('fs').PathLike} PathLike
 * @param {string} srcPath The src path of a
 * @param {string} destPath A path to a file or directory
 */
const copyDirContents = async (srcPath, destPath) => {
  const srcStat = await fs.stat(srcPath);
  if (!srcStat.isDirectory()) {
    throw new Error(`Source ${srcPath} is not a directory`);
  }

  if (await exists(destPath)) {
    const destStat = await fs.stat(destPath);
    if (!destStat.isDirectory()) {
      throw new Error(`Destination ${destPath} is not a directory`);
    }
  } else {
    await fs.mkdir(destPath);
  }

  const srcItems = await fs.readdir(srcPath);

  for (const srcItem of srcItems) {
    const srcItemPath = path.resolve(srcPath, srcItem);
    const srcItemStat = await fs.stat(srcItemPath);

    const destItemPath = path.resolve(destPath, srcItem);

    if (srcItemStat.isFile()) {
      // destItemPath will also be a file path, not a folder
      await fs.copyFile(srcItemPath, destItemPath);
    } else if (srcItemStat.isDirectory()) {
      // recursively copy src item directory contents
      await copyDirContents(srcItemPath, destItemPath);
    }
  }
};

module.exports = copyDirContents;
