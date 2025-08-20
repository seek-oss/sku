import { readdirSync } from 'node:fs';

export const isEmptyDir = (dirPath: string): boolean => {
  try {
    const files = readdirSync(dirPath);
    return files.length === 0;
  } catch {
    return true; // Directory doesn't exist, consider it empty
  }
};
