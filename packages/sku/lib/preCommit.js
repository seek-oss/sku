// @ts-check
const chalk = require('chalk');

const config = require('../config/lintStaged/lintStagedConfig');

module.exports = async () => {
  let success = false;
  try {
    // @ts-expect-error `@types/lint-staged` is wrong, and for some reason `tsc` doesn't pick up the
    // existing JSDoc type definitions.
    // https://github.com/lint-staged/lint-staged/issues/1359
    const { default: lintStaged } = await import('lint-staged');
    success = await lintStaged({ config });
  } catch (e) {
    console.error(chalk.red(e));
  }

  if (!success) {
    throw new Error('Error: Pre-commit failed');
  }
};
