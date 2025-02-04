import chalk from 'chalk';

import config from '../config/lintStaged/lintStagedConfig.js';

const preCommit = async () => {
  let success = false;
  try {
    const { default: lintStaged } = await import('lint-staged');
    success = await lintStaged({ config });
  } catch (e) {
    console.error(chalk.red(e));
  }

  if (!success) {
    throw new Error('Error: Pre-commit failed');
  }
};

export default preCommit;
