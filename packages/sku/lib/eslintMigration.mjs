// @ts-check
import { rm } from 'node:fs/promises';
import { includeIgnoreFile } from '@eslint/compat';

import { createEslintIgnoresConfig } from '../config/eslint/ignores.js';

import { getPathFromCwd } from './cwd.js';
import exists from './exists.js';
import { SkuConfigUpdater } from './SkuConfigUpdater.js';

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

/**
 * @param {object} options
 * @param {string[]} options.skuEslintIgnores - Eslint ignores configured by sku
 *
 */
const isCustomIgnoreEntry =
  ({ skuEslintIgnores }) =>
  /**
   * @param {string} ignoreEntry
   */
  (ignoreEntry) => {
    return !(
      skuEslintIgnores.includes(ignoreEntry) ||
      oldIgnoreEntries.includes(ignoreEntry)
    );
  };

/**
 * Migrates the eslint ignore file at the provided path into an eslint v9 config object containing
 * an `ignores` array.
 *
 * Removes ignore entries that are already ignored by sku's eslint config or that no longer need to
 * be ignored.
 *
 * @param {object} options
 * @param {string | undefined} options.eslintIgnorePath - Path to the .eslintignore file
 * @param {boolean} options.hasLanguagesConfig - Whether 'languages' is configured in sku config
 * @param {string | undefined} options.target - The configured 'target' directory in sku config
 *
 * @returns {string[]}}
 */
export const migrateEslintignore = ({
  eslintIgnorePath: _eslintIgnorePath = getPathFromCwd('.eslintignore'),
  hasLanguagesConfig,
  target,
}) => {
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
 * @param {object} options
 * @param {string} options.skuConfigPath - Path to the sku config file
 * @param {string[]} options.eslintIgnore - Array of paths to ignore
 */
export const addEslintIgnoreToSkuConfig = async ({
  skuConfigPath,
  eslintIgnore,
}) => {
  const updater = await SkuConfigUpdater.fromFile(skuConfigPath);
  updater.upsertConfig({ property: 'eslintIgnore', value: eslintIgnore });
  await updater.commitConfig();
};
