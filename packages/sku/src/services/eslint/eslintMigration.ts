import { rm } from 'node:fs/promises';
import { includeIgnoreFile } from '@eslint/compat';

import { createEslintIgnoresConfig } from '../../config/eslint/ignores.js';

import { getPathFromCwd } from '../../lib/cwd.js';
import exists from '../../lib/exists.js';
import { SkuConfigUpdater } from '../../lib/SkuConfigUpdater.js';

const oldEslintConfigPath = getPathFromCwd('.eslintrc');
const eslintIgnorePath = getPathFromCwd('.eslintignore');

export const shouldMigrateOldEslintConfig = async () => {
  const [oldEslintConfigExists, eslintIgnoreExists] = await Promise.all([
    exists(oldEslintConfigPath),
    exists(eslintIgnorePath),
  ]);

  const shouldMigrate = oldEslintConfigExists || eslintIgnoreExists;

  return {
    shouldMigrate,
    eslintIgnoreExists,
  };
};

export const cleanUpOldEslintFiles = async () => {
  await rm(oldEslintConfigPath, { force: true });
  await rm(eslintIgnorePath, { force: true });
};

// Old ignore entries that no longer need to be ignored
const oldIgnoreEntries = ['**/.eslintrc'];

const isCustomIgnoreEntry =
  ({ skuEslintIgnores }: { skuEslintIgnores: string[] }) =>
  (ignoreEntry: string) =>
    !(
      skuEslintIgnores.includes(ignoreEntry) ||
      oldIgnoreEntries.includes(ignoreEntry)
    );

/**
 * Migrates the eslint ignore file at the provided path into an eslint v9 config object containing
 * an `ignores` array.
 *
 * Removes ignore entries that are already ignored by sku's eslint config or that no longer need to
 * be ignored.
 */
export const migrateEslintignore = ({
  eslintIgnorePath: _eslintIgnorePath = getPathFromCwd('.eslintignore'),
  hasLanguagesConfig,
  target,
}: {
  /** Path to the .eslintignore file */
  eslintIgnorePath?: string;
  /** Whether 'languages' is configured in sku config */
  hasLanguagesConfig: boolean;
  /** The configured 'target' directory in sku config */
  target?: string;
}): string[] => {
  const result = includeIgnoreFile(_eslintIgnorePath);
  const { ignores: skuEslintIgnores } = createEslintIgnoresConfig({
    hasLanguagesConfig,
    target,
  });

  const customIgnores =
    result.ignores?.filter(isCustomIgnoreEntry({ skuEslintIgnores })) || [];

  return customIgnores;
};

/**
 * Adds the provided eslintIgnore array to the sku config at the provided path.
 */
export const addEslintIgnoreToSkuConfig = async ({
  skuConfigPath,
  eslintIgnore,
}: {
  /** Path to the sku config file */
  skuConfigPath: string;
  /** Array of paths to ignore */
  eslintIgnore: string[];
}) => {
  const updater = await SkuConfigUpdater.fromFile(skuConfigPath);
  updater.upsertConfig({ property: 'eslintIgnore', value: eslintIgnore });
  await updater.commitConfig();
};
