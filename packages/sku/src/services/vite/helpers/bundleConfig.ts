import path from 'node:path';

import { getDistDirectories } from '../../../utils/distDirectories.js';

/**
 * Resolves the Vite output directories for a build target.
 * SSR output always uses subfolders, so SSR callers pass `true`.
 */
export const createOutDir = ({
  targetPath,
  useSubfolders,
}: {
  targetPath: string;
  useSubfolders: boolean;
}) => ({
  ...getDistDirectories({ targetPath, useSubfolders }),
  ssg: path.join(targetPath, 'render'),
  join: (subPath: string) => path.join(targetPath, subPath),
});

export const renderEntryChunkName = 'render.js';
