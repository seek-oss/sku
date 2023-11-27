const chalk = require('chalk');

const config = require('../config/lintStaged/lintStagedConfig');
const lintStaged = require('lint-staged');

module.exports = async () => {
  let success = false;
  try {
    success = await lintStaged({ config });
  } catch (e) {
    console.error(chalk.red(e));
  }

  if (!success) {
    throw new Error('Error: Pre-commit failed');
  }
};
