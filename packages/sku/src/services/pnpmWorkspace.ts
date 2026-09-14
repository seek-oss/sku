import {
  checkPnpmWorkspaceConfig,
  ensurePnpmWorkspaceConfig,
  isPnpm,
  rootDir,
} from '@sku-private/utils';
import { accentLight, critical, info } from '@sku-private/utils/console';
import { suggestScript } from '../utils/suggestScript.js';
import {
  FAILURE_EXIT_CODE,
  SUCCESS_EXIT_CODE,
  type LintResult,
} from '../utils/runLintChecks.js';

const lintFailure = (error: unknown): LintResult => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(critical(message));
  return { exitCode: FAILURE_EXIT_CODE };
};

export const pnpmWorkspaceCheck = async (): Promise<LintResult> => {
  console.log(accentLight(`Checking pnpm workspace configuration`));

  if (!isPnpm || !rootDir) {
    return { exitCode: SUCCESS_EXIT_CODE };
  }

  try {
    const { hasFailure, failures, advisories } = await checkPnpmWorkspaceConfig(
      {
        targetDir: rootDir,
      },
    );

    for (const advisory of advisories) {
      console.log(info(advisory));
    }

    if (hasFailure) {
      for (const failure of failures) {
        console.error(critical(failure));
      }
      suggestScript('format');
      return { exitCode: FAILURE_EXIT_CODE };
    }

    return { exitCode: SUCCESS_EXIT_CODE };
  } catch (error) {
    return lintFailure(error);
  }
};

export const pnpmWorkspaceSync = async (): Promise<LintResult> => {
  console.log(accentLight(`Syncing pnpm workspace configuration`));

  if (!isPnpm || !rootDir) {
    return { exitCode: SUCCESS_EXIT_CODE };
  }

  try {
    await ensurePnpmWorkspaceConfig({ targetDir: rootDir });
    return { exitCode: SUCCESS_EXIT_CODE };
  } catch (error) {
    return lintFailure(error);
  }
};
