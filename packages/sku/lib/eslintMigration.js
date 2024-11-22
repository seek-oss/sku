// @ts-check
const { rm } = require('node:fs/promises');
const { includeIgnoreFile } = require('@eslint/compat');

const { createEslintIgnoresConfig } = require('../config/eslint/ignores.js');

const { getPathFromCwd } = require('./cwd.js');
const exists = require('./exists.js');
const { SkuConfigUpdater } = require('./SkuConfigUpdater.js');

const oldEslintConfigPath = getPathFromCwd('.eslintrc');
const eslintIgnorePath = getPathFromCwd('.eslintignore');

const shouldMigrateOldEslintConfig = async () =>
  (
    await Promise.all([exists(oldEslintConfigPath), exists(eslintIgnorePath)])
  ).some(Boolean);

const cleanUpOldEslintFiles = async () => {
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
 * @param {string} options.eslintignorePath - Path to the .eslintignore file
 * @param {boolean} options.hasLanguagesConfig - Whether 'languages' is configured in sku config
 * @param {string | undefined} options.target - The configured 'target' directory in sku config
 *
 * @returns {string[]}}
 */
const migrateEslintignore = ({
  eslintignorePath,
  hasLanguagesConfig,
  target,
}) => {
  const result = includeIgnoreFile(eslintignorePath);
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
const addEslintIgnoreToSkuConfig = async ({ skuConfigPath, eslintIgnore }) => {
  const updater = await SkuConfigUpdater.fromFile(skuConfigPath);
  updater.upsertConfig({ property: 'eslintIgnore', value: eslintIgnore });
  await updater.commitConfig();
};

module.exports = {
  shouldMigrateOldEslintConfig,
  cleanUpOldEslintFiles,
  migrateEslintignore,
  addEslintIgnoreToSkuConfig,
};
