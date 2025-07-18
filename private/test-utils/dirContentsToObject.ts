import { relative } from 'node:path';
import { readFile } from 'node:fs/promises';

import klaw from 'klaw';

// Ignore contents of files where the content changes
// regularly, is non-deterministic, or is binary data.
const IGNORED_FILE_EXTENSIONS = [
  'mjs',
  'cjs',
  'js',
  'map',
  'avif',
  'bmp',
  'gif',
  'jpg',
  'jpeg',
  'png',
  'svg',
  'webp',
];
const ignoredFilePattern = new RegExp(
  `\\.(${IGNORED_FILE_EXTENSIONS.join('|')})$`,
  'i',
);

export const dirContentsToObject = async (
  dirname: string,
  includeExtensions?: string[],
) => {
  const files: Record<string, string> = {};

  for await (const file of klaw(dirname)) {
    if (file.stats.isFile()) {
      const relativeFilePath = relative(dirname, file.path);

      if (
        !includeExtensions ||
        includeExtensions.filter((ext) => relativeFilePath.endsWith(ext))
          .length > 0
      ) {
        files[relativeFilePath] = ignoredFilePattern.test(relativeFilePath)
          ? 'CONTENTS IGNORED IN SNAPSHOT TEST'
          : await readFile(file.path, 'utf8');
      }
    }
  }

  return files;
};
