import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  checkPnpmWorkspaceConfig,
  isPnpm,
  rootDir,
  syncPnpmWorkspaceConfig,
} from '@sku-private/utils';
import { critical, info } from '@sku-private/utils/console';
import { suggestScript } from '../../../../../utils/suggestScript.js';

interface WorkspaceActionOptions {
  check?: boolean;
}

export const workspaceAction = async ({ check }: WorkspaceActionOptions) => {
  if (!isPnpm || !rootDir) {
    return;
  }

  try {
    if (check) {
      if (!existsSync(join(rootDir, 'pnpm-workspace.yaml'))) {
        console.error(
          critical(
            `No pnpm-workspace.yaml found at the workspace root: ${rootDir}`,
          ),
        );
        suggestScript('configure workspace');
        process.exit(1);
      }

      const { hasFailure, failures, advisories } =
        await checkPnpmWorkspaceConfig({ targetDir: rootDir });

      for (const advisory of advisories) {
        console.log(info(advisory));
      }

      if (hasFailure) {
        for (const failure of failures) {
          console.error(critical(failure));
        }
        suggestScript('configure workspace');
        process.exit(1);
      }

      return;
    }

    await syncPnpmWorkspaceConfig({ targetDir: rootDir, create: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(critical(message));
    process.exit(1);
  }
};
