import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { isPnpm, rootDir } from '@sku-private/utils';
import {
  checkPnpmWorkspaceConfig,
  pnpmWorkspaceFileName,
  syncPnpmWorkspaceConfig,
} from '@sku-private/utils/pnpm-workspace';
import { critical } from '@sku-private/utils/console';
import {
  reportWorkspaceCheck,
  reportWorkspaceError,
} from '../../../../../services/pnpmWorkspace.js';
import { suggestScript } from '../../../../../utils/suggestScript.js';

const remedyScript = 'configure workspace';

interface WorkspaceActionOptions {
  check?: boolean;
}

export const workspaceAction = async ({ check }: WorkspaceActionOptions) => {
  if (!isPnpm || !rootDir) {
    return;
  }

  try {
    if (!check) {
      await syncPnpmWorkspaceConfig({ targetDir: rootDir, create: true });
      return;
    }

    if (!existsSync(join(rootDir, pnpmWorkspaceFileName))) {
      console.error(
        critical(
          `No ${pnpmWorkspaceFileName} found at the workspace root: ${rootDir}`,
        ),
      );
      suggestScript(remedyScript);
      process.exit(1);
    }

    const result = await checkPnpmWorkspaceConfig({ targetDir: rootDir });
    if (reportWorkspaceCheck(result, remedyScript)) {
      process.exit(1);
    }
  } catch (error) {
    reportWorkspaceError(error);
    process.exit(1);
  }
};
