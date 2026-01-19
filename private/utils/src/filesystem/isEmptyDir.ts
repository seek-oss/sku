import { statSync, readdirSync, type PathLike } from 'node:fs';

/**
 * Returns whether the given directory is empty, throwing if the path is not a directory
 */
export const isEmptyDir = (path: PathLike) => {
  const isDirectory = statSync(path).isDirectory();

  if (!isDirectory) {
    throw new Error(`${path} is not a directory`);
  }

  const files = readdirSync(path);

  return files.length === 0;
};
