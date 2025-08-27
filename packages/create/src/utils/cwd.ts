import { join } from 'node:path';

let cwd = process.cwd();

export const setCwd = (dir: string) => {
  cwd = dir;
};

export const getCwd = () => cwd;

export const getPathFromCwd = (filePath: string) => join(cwd, filePath);
