const { Command } = require('commander');

const init = new Command('init');

init
  .description('Initialize a new sku project')
  .argument('[packageName]', 'Package name')
  .option('--verbose', 'Verbose log output')
  .action((packageName, verbose) => {
    const initAction = require('./init.action');
    initAction(packageName, { verbose });
  });

module.exports = init;
