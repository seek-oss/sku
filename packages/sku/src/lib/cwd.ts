import { prependWithManagedConfigBanner } from './managedConfigBanner.js';
import { writeFile } from 'node:fs/promises';

import { join } from 'node:path';
import { createRequire } from 'node:module';

let currentCwd = process.cwd();

const require = createRequire(import.meta.url);

export const setCwd = (newCwd: string) => {
  if (newCwd) {
    currentCwd = newCwd;
  }
};

export const cwd = () => currentCwd;

export const getPathFromCwd = (filePath: string) => join(currentCwd, filePath);

export const requireFromCwd = (modulePath: string) =>
  require(require.resolve(modulePath, { paths: [cwd()] }));

/**
 * Write the provided `content` to the file at `fileName` in the current working directory.
 *  If `content` is an object, it will be stringified.
 *
 * Optionally prepend the content with the managed config banner.
 */
export const writeFileToCWD = async (
  fileName: string,
  content: string | Record<string, unknown>,
  { banner = true }: { banner?: boolean } = {},
) => {
  const outPath = getPathFromCwd(fileName);
  const str =
    typeof content === 'string' ? content : JSON.stringify(content, null, 2);
  const contentStr = banner ? prependWithManagedConfigBanner(str) : str;

  await writeFile(outPath, contentStr);
};
