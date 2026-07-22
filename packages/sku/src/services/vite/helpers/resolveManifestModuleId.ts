import {
  dirname,
  extname,
  resolve,
  parse as pathParse,
  relative,
} from 'node:path';
import { readdirSync } from 'node:fs';

const stripViteQuery = (filePath: string) => filePath.split('?')[0] ?? filePath;

const toPosixPath = (filePath: string) => filePath.replace(/\\/g, '/');

/**
 * Resolve a dynamic import specifier to the Vite client manifest key
 * (cwd-relative source path with the real file extension).
 *
 * Mirrors the loadable preloadPlugin path-resolution approach: resolve the
 * import relative to the importer, sniff the on-disk extension, emit a
 * posix path relative to `cwd` (defaults to `process.cwd()`).
 */
export const resolveManifestModuleId = ({
  importerId,
  importPath,
  cwd = process.cwd(),
}: {
  importerId: string;
  importPath: string;
  cwd?: string;
}): string | null => {
  const cleanImporterId = stripViteQuery(importerId);
  const absolutePath = resolve(dirname(cleanImporterId), importPath);
  const directory = dirname(absolutePath);

  let files: string[];
  try {
    files = readdirSync(directory);
  } catch {
    return null;
  }

  const name = pathParse(absolutePath).base;
  const found = files.find(
    (file) =>
      file.replace(extname(file), '') === name.replace(extname(name), ''),
  );

  if (!found) {
    return null;
  }

  return toPosixPath(relative(cwd, resolve(directory, found)));
};
