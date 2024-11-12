// @ts-check
const { getPathFromCwd } = require('./cwd');
const exists = require('./exists.js');
const { rm } = require('node:fs/promises');

const oldEslintConfigPath = getPathFromCwd('.eslintrc');
const eslintIgnorePath = getPathFromCwd('.eslintignore');
const { ignores: skuEslintIgnores } = require('../config/eslint/ignores.js');

const { includeIgnoreFile } = require('@eslint/compat');

const shouldMigrateEslintIgnore = async () =>
  (
    await Promise.all([exists(oldEslintConfigPath), exists(eslintIgnorePath)])
  ).every(Boolean);

const cleanUpOldEslintFiles = async () => {
  // Delete .eslintignore and .eslintrc files created by older versions of sku
  await rm(oldEslintConfigPath, { force: true });
  await rm(eslintIgnorePath, { force: true });
};

/**
 * Migrates the eslint ignore file at the provided path into an eslint v9 config object containing
 * an `ignores` array.
 * Removes ignore entries that are already ignored by sku's eslint config.
 *
 * @param {string} eslintignorePath
 * @returns {{ignores: string[]}}
 */
function migrateEslintignore(eslintignorePath) {
  const result = includeIgnoreFile(eslintignorePath);
  const userIgnores =
    result.ignores?.filter(
      (ignore) => !skuEslintIgnores.ignores.includes(ignore),
    ) || [];

  return { ignores: userIgnores };
}

/**
 * Adds the provided `eslintIgnore` array to the sku config at `skuConfigPath`.
 *
 * @param {{ skuConfigPath: string, eslintIgnore: string[] }} options
 */
const addEslintIgnoresToSkuConfig = ({ skuConfigPath, eslintIgnore }) => {
  // TODO: Babel parse, add an `eslintIgnore` key to the sku config, babel generate??, format the result, write it back to the file
};

module.exports = {
  migrateEslintignore,
  cleanUpOldEslintFiles,
  shouldMigrateEslintIgnore,
};
