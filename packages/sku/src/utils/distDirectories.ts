import path from 'node:path';

/**
 * Resolves the output directories for a build target.
 *
 * - `distClient`: client assets and `public` files
 * - `distRendered`: rendered HTML and metadata (static builds only)
 * - `distServer`: the SSR server build
 *
 * With `useSubfolders` off, every directory is the target itself (the legacy layout).
 */
export const getDistDirectories = ({
  targetPath,
  useSubfolders,
}: {
  targetPath: string;
  useSubfolders: boolean;
}) => ({
  distClient: useSubfolders ? path.join(targetPath, 'client') : targetPath,
  distRendered: useSubfolders ? path.join(targetPath, 'rendered') : targetPath,
  distServer: useSubfolders ? path.join(targetPath, 'server') : targetPath,
});
