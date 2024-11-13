// @ts-check
const { getPathFromCwd } = require('./cwd');
const exists = require('./exists.js');
const { rm, readFile, writeFile } = require('node:fs/promises');

const oldEslintConfigPath = getPathFromCwd('.eslintrc');
const eslintIgnorePath = getPathFromCwd('.eslintignore');
const { ignores: skuEslintIgnores } = require('../config/eslint/ignores.js');

const { includeIgnoreFile } = require('@eslint/compat');

const prettier = require('prettier');
const prettierConfig = require('../config/prettier/prettierConfig.js');

const { parseModule, builders, generateCode } = require('magicast');
const { getConfigFromVariableDeclaration } = require('magicast/helpers');

const t = require('@babel/types');

const debug = require('debug');
const log = debug('sku:eslint-migration');

const shouldMigrateEslintIgnore = async () =>
  (
    await Promise.all([exists(oldEslintConfigPath), exists(eslintIgnorePath)])
  ).some(Boolean);

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
const addEslintIgnoreToSkuConfig = async ({ skuConfigPath, eslintIgnore }) => {
  console.log("Adding 'eslintIgnore' to sku config...");

  try {
    const skuConfigContents = await readFile(skuConfigPath, 'utf8');
    const skuConfigModule = parseModule(skuConfigContents);

    if (skuConfigContents.includes('module.exports = {')) {
      log('Found sku config with CJS export');

      const eslintIgnoreObjectProperty = builders.literal({
        eslintIgnore,
      }).properties[0];
      t.assertProgram(skuConfigModule.$ast);
      const lastStatement = skuConfigModule.$ast.body.at(-1);
      t.assertExpressionStatement(lastStatement);

      t.assertAssignmentExpression(lastStatement.expression);
      t.assertMemberExpression(lastStatement.expression.left);
      t.assertIdentifier(lastStatement.expression.left.object, {
        name: 'module',
      });
      t.assertIdentifier(lastStatement.expression.left.property, {
        name: 'exports',
      });
      t.assertObjectExpression(lastStatement.expression.right);
      lastStatement.expression.right.properties.push(
        eslintIgnoreObjectProperty,
      );
    } else {
      log('Found sku config with ESM export');

      if (skuConfigModule.exports.default.$type === 'object') {
        skuConfigModule.exports.default.eslintIgnore = eslintIgnore;
      } else {
        const { declaration, config } =
          getConfigFromVariableDeclaration(skuConfigModule);
        if (!config) {
          throw new Error('bad');
        }
        console.log({ a: config.$ast });
        config.eslintIgnore = eslintIgnore;
        declaration.init = generateCode(config).code;
        // t.assertObjectExpression(skuConfigDeclaration.init);
        // const eslintIgnoreObjectProperty = builders.literal({
        //   eslintIgnore,
        // }).properties[0];
        // skuConfigDeclaration.init.properties.push(eslintIgnoreObjectProperty);
      }
    }

    const modifiedSkuConfigContents = prettier.format(
      skuConfigModule.generate().code,
      {
        parser: 'typescript',
        ...prettierConfig,
      },
    );

    await writeFile(skuConfigPath, modifiedSkuConfigContents);
  } catch (e) {
    console.error(
      `Failed to add "eslintIgnore" to sku config at ${skuConfigPath}`,
    );
    console.error(e);
    console.log('Please manually add the following config to your sku config:');
    console.log(`eslintIgnore: ${JSON.stringify(eslintIgnore)}`);
  }
};

module.exports = {
  migrateEslintignore,
  cleanUpOldEslintFiles,
  shouldMigrateEslintIgnore,
  addEslintIgnoreToSkuConfig,
};
