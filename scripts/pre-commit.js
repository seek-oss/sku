#!/usr/bin/env node
const chalk = require('chalk');
const preCommit = require('../lib/preCommit');

(async () => {
  try {
    await preCommit();
  } catch (e) {
    console.error(chalk.red(e));
    process.exit(1);
  }
})();
