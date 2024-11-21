// @ts-check
const { rm } = require('node:fs/promises');
const { includeIgnoreFile } = require('@eslint/compat');

const { ignores: skuEslintIgnores } = require('../config/eslint/ignores.js');

const { getPathFromCwd } = require('./cwd.js');
const exists = require('./exists.js');
const { SkuConfigUpdater } = require('./SkuConfigUpdater.js');

const oldEslintConfigPath = getPathFromCwd('.eslintrc');
const eslintIgnorePath = getPathFromCwd('.eslintignore');

const shouldMigrateEslintIgnore = async () =>
  (
    await Promise.all([exists(oldEslintConfigPath), exists(eslintIgnorePath)])
  ).some(Boolean);

const cleanUpOldEslintFiles = async () => {
  await rm(oldEslintConfigPath, { force: true });
  await rm(eslintIgnorePath, { force: true });
};

/**
 * Migrates the eslint ignore file at the provided path into an eslint v9 config object containing
 * an `ignores` array.
 *
 * Removes ignore entries that are already ignored by sku's eslint config.
 *
 * @param {string} eslintignorePath
 * @returns {string[]}}
 */
const migrateEslintignore = (eslintignorePath) => {
  const result = includeIgnoreFile(eslintignorePath);
  const userIgnores =
    result.ignores?.filter(
      (ignore) => !skuEslintIgnores.ignores.includes(ignore),
    ) || [];

  return userIgnores;
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
  shouldMigrateEslintIgnore,
  cleanUpOldEslintFiles,
  migrateEslintignore,
  addEslintIgnoreToSkuConfig,
};
