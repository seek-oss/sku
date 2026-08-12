import { rename } from 'node:fs/promises';
import path from 'node:path';

/**
 * Vite client manifest filename (relative to client/server outDirs). Production
 * loads it from server/.
 */
export const CLIENT_MANIFEST_RELATIVE_PATH = 'manifest.json';

/**
 * Move the Vite client manifest into server/ so production can
 * resolve Document assets without sibling client/
 */
export const moveClientManifestToServer = async ({
  ssrClient,
  ssr,
}: {
  ssrClient: string;
  ssr: string;
}) => {
  await rename(
    path.join(ssrClient, CLIENT_MANIFEST_RELATIVE_PATH),
    path.join(ssr, CLIENT_MANIFEST_RELATIVE_PATH),
  );
};
