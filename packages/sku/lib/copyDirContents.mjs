// @ts-check
import { resolve } from 'node:path';
import { stat, mkdir, readdir, copyFile } from 'node:fs/promises';
import exists from './exists.js';

/**
 * Recursively copy the contents of a directory into another directory
 * If the desitnation directory does not already exist, it will be created
 *
 * @typedef {import('fs').PathLike} PathLike
 * @param {string} srcPath The src path of a
 * @param {string} destPath A path to a file or directory
 */
const copyDirContents = async (srcPath, destPath) => {
  const srcStat = await stat(srcPath);
  if (!srcStat.isDirectory()) {
    throw new Error(`Source ${srcPath} is not a directory`);
  }

  if (await exists(destPath)) {
    const destStat = await stat(destPath);
    if (!destStat.isDirectory()) {
      throw new Error(`Destination ${destPath} is not a directory`);
    }
  } else {
    await mkdir(destPath);
  }

  const srcItems = await readdir(srcPath);

  for (const srcItem of srcItems) {
    const srcItemPath = resolve(srcPath, srcItem);
    const srcItemStat = await stat(srcItemPath);

    const destItemPath = resolve(destPath, srcItem);

    if (srcItemStat.isFile()) {
      // destItemPath will also be a file path, not a folder
      await copyFile(srcItemPath, destItemPath);
    } else if (srcItemStat.isDirectory()) {
      // recursively copy src item directory contents
      await copyDirContents(srcItemPath, destItemPath);
    }
  }
};

export default copyDirContents;
