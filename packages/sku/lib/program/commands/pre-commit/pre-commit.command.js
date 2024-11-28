const { Command } = require('commander');

const preCommit = new Command('pre-commit');

preCommit.description('Run the sku pre-commit hook.').action(() => {
  const preCommitAction = require('./pre-commit.action');
  preCommitAction();
});

module.exports = preCommit;
