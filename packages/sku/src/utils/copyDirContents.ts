import { cp, stat } from 'node:fs/promises';
import { hasErrorCode } from './error-guards.js';

export const copyDirContents = async (srcPath: string, destPath: string) => {
  const srcStat = await stat(srcPath);
  if (!srcStat.isDirectory()) {
    throw new Error(`Source ${srcPath} is not a directory`);
  }

  try {
    const destStat = await stat(destPath);
    if (!destStat.isDirectory()) {
      throw new Error(`Destination ${destPath} is not a directory`);
    }
  } catch (error) {
    if (!hasErrorCode(error) || error.code !== 'ENOENT') {
      throw error;
    }
  }

  await cp(srcPath, destPath, { recursive: true });
};
