/**
 * `sku lint` and `sku format` integration for `pnpm-workspace.yaml`.
 *
 * Both target the project directory rather than the detected workspace root, so
 * a monorepo's root config is left to the explicit `sku configure workspace`.
 */
import { isPnpm, rootDir } from '@sku-private/utils';
import {
  checkPnpmWorkspaceConfig,
  syncPnpmWorkspaceConfig,
  type PnpmWorkspaceCheckResult,
} from '@sku-private/utils/pnpm-workspace';
import { accentLight, critical, info } from '@sku-private/utils/console';
import { suggestScript } from '../utils/suggestScript.js';
import {
  FAILURE_EXIT_CODE,
  SUCCESS_EXIT_CODE,
  type LintResult,
} from '../utils/runLintChecks.js';

export const reportWorkspaceError = (error: unknown): void => {
  console.error(
    critical(error instanceof Error ? error.message : String(error)),
  );
};

/**
 * Prints advisories, then failures followed by a nudge towards `remedyScript`.
 *
 * @returns Whether the config failed the check.
 */
export const reportWorkspaceCheck = (
  { failures, advisories }: PnpmWorkspaceCheckResult,
  remedyScript: string,
): boolean => {
  for (const advisory of advisories) {
    console.log(info(advisory));
  }

  if (failures.length === 0) {
    return false;
  }

  for (const failure of failures) {
    console.error(critical(failure));
  }
  suggestScript(remedyScript);

  return true;
};

const lintFailure = (error: unknown): LintResult => {
  reportWorkspaceError(error);
  return { exitCode: FAILURE_EXIT_CODE };
};

export const pnpmWorkspaceCheck = async (): Promise<LintResult> => {
  if (!isPnpm || !rootDir) {
    return { exitCode: SUCCESS_EXIT_CODE };
  }

  console.log(accentLight('Checking pnpm workspace configuration'));

  try {
    const result = await checkPnpmWorkspaceConfig({ targetDir: process.cwd() });
    const failed = reportWorkspaceCheck(result, 'format');

    return { exitCode: failed ? FAILURE_EXIT_CODE : SUCCESS_EXIT_CODE };
  } catch (error) {
    return lintFailure(error);
  }
};

export const pnpmWorkspaceSync = async (): Promise<LintResult> => {
  if (!isPnpm || !rootDir) {
    return { exitCode: SUCCESS_EXIT_CODE };
  }

  console.log(accentLight('Syncing pnpm workspace configuration'));

  try {
    await syncPnpmWorkspaceConfig({ targetDir: process.cwd() });
    return { exitCode: SUCCESS_EXIT_CODE };
  } catch (error) {
    return lintFailure(error);
  }
};
