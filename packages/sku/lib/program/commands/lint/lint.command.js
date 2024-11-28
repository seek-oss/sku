const { Command } = require('commander');

const lint = new Command('lint');

lint
  .description('Run lint tooling over your code.')
  .argument('[paths...]', 'paths to lint')
  .action((paths) => {
    const lintAction = require('./lint.action');
    lintAction(paths);
  });

module.exports = lint;
