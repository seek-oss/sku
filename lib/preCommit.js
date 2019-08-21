const chalk = require('chalk');
const lintStaged = require('lint-staged');
const configPath = require.resolve('../config/lintStaged/lintStagedConfig');

module.exports = async () => {
  let success = false;
  try {
    success = await lintStaged({ configPath });
  } catch (e) {
    console.error(chalk.red(e));
  }

  if (!success) {
    throw new Error('Error: Pre-commit failed');
  }
};
