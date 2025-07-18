import { readFile, writeFile } from 'node:fs/promises';
import exists from '@/utils/exists.js';
import { getPnpmConfigValue } from './getPnpmConfigValue.js';
import path from 'node:path';
import chalk from 'chalk';

const skuPublicHoistPatterns = ['eslint', 'prettier'];
const skuOnlyBuiltDependencies = ['sku'];

/**
 * IDE tooling depends on finding `eslint` and `prettier` in the root `node_modules`.
 * `sku` consumers do not directly install these dependencies, so without this
 * configuration they would not be present in the root `node_modules`, causing discrepancies
 * between IDE linting and CLI linting.
 *
 * PNPM v9 used to hoist these dependencies by default, but PNPM v10 no longer hoists any
 * dependencies by default.
 * See https://github.com/pnpm/pnpm/releases/tag/v10.0.0#:~:text=nothing%20is%20hoisted%20by%20default
 *
 * Additionally, in order for `sku`s postinstall script to run, it needs to be listed under
 * `onlyBuiltDependencies`.
 */
export const skuPnpmConfig = [
  'publicHoistPattern:',
  ...skuPublicHoistPatterns.map((dep) => `  - ${dep}`),
  'onlyBuiltDependencies:',
  ...skuOnlyBuiltDependencies.map((dep) => `  - ${dep}`),
].join('\n');

export type PnpmConfigAction = 'create' | 'update' | 'log' | 'noop';

export const createOrUpdatePnpmConfig = async ({
  rootDir,
  action,
}: {
  rootDir: string;
  action: PnpmConfigAction;
}) => {
  // Config is already correct, so no action is needed
  if (action === 'noop') {
    return;
  }

  const pnpmWorkspaceFilePath = path.join(rootDir, 'pnpm-workspace.yaml');

  // pnpm-workspace.yaml does not exist and we can safely initialize it with config that
  // won't conflict with existing config
  if (action === 'create') {
    const contents = skuPnpmConfig;
    await writeFile(pnpmWorkspaceFilePath, contents, 'utf-8');

    console.log(
      chalk.bold(
        `Created pnpm-workspace.yaml. Please run ${chalk.blue('pnpm install')}.`,
      ),
    );

    return;
  }

  // There is potentially conflicting config somewhere, so log a message instructing
  // the user to update the config manually
  if (action === 'log') {
    console.log(
      chalk.yellow(
        'Potentially conflicting PNPM config detected. Please update your pnpm-workspace.yaml manually with the following config:',
      ),
    );
    console.log(chalk.blue(skuPnpmConfig));
    console.log(
      chalk.bold(
        `After updating your config, please run ${chalk.blue('pnpm install')}.`,
      ),
    );

    return;
  }

  // pnpm-workspace.yaml exists and there is no conflicting config elsewhere, so we can safely
  // inject the config we want
  if (action === 'update') {
    const contents = await readFile(pnpmWorkspaceFilePath, 'utf-8');

    const updatedContents = `${contents}\n${skuPnpmConfig}`;
    await writeFile(pnpmWorkspaceFilePath, updatedContents, 'utf-8');

    console.log(
      chalk.bold(
        `Updated existing pnpm-workspace.yaml. Please run ${chalk.blue('pnpm install')}.`,
      ),
    );

    return;
  }
};

export const getPnpmConfigAction = async ({
  npmrcExists,
  pnpmWorkspaceFileExists,
}: {
  npmrcExists: boolean;
  pnpmWorkspaceFileExists: boolean;
}): Promise<PnpmConfigAction> => {
  if (!pnpmWorkspaceFileExists && !npmrcExists) {
    return 'create';
  }

  const publicHoistPatterns =
    (await getPnpmConfigValue('public-hoist-pattern')) ?? [];
  const onlyBuiltDependencies =
    (await getPnpmConfigValue('only-built-dependencies')) ?? [];

  const hasExpectedPublicHoistPatterns = skuPublicHoistPatterns.every(
    (pattern) => publicHoistPatterns.includes(pattern),
  );

  const hasExpectedOnlyBuiltDependencies = skuOnlyBuiltDependencies.every(
    (dep) => onlyBuiltDependencies.includes(dep),
  );

  if (hasExpectedPublicHoistPatterns && hasExpectedOnlyBuiltDependencies) {
    return 'noop';
  }

  // It's only safe to update/create the pnpm workspace file if there is no existing config for
  // these properties. If there is existing config, new config added to pnpm-workspace.yaml will
  // either override or conflict with it, so we should update and comment the config instead.
  if (publicHoistPatterns.length === 0 && onlyBuiltDependencies.length === 0) {
    if (pnpmWorkspaceFileExists) {
      return 'update';
    }

    return 'create';
  }

  // In all other cases, simply log a message instructing the user to update the config manually
  return 'log';
};

export const detectPnpmConfigFiles = async (rootDir: string) => {
  const npmrcExists = await exists(path.join(rootDir, '.npmrc'));

  if (npmrcExists) {
    console.log(
      chalk.yellow(
        "Found '.npmrc' file. It is strongly recommended to migrate all .npmrc configuration to 'pnpm-workspace.yaml' and gitignore '.npmrc'. See https://pnpm.io/settings for more information.",
      ),
    );
  }

  const pnpmWorkspaceFileExists = await exists(
    path.join(rootDir, 'pnpm-workspace.yaml'),
  );

  return { pnpmWorkspaceFileExists, npmrcExists };
};
