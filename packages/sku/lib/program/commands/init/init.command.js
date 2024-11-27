const { Command } = require('commander');
const packageManagerOption = require('../../options/packageManager/packageManager.option');

const init = new Command('init');

init
  .description('Initialize a new sku project')
  .argument('[packageName]', 'Package name')
  .option(
    '--verbose',
    "Sets the underlying packageManager's log level to `verbose`",
  )
  .addOption(packageManagerOption)
  .action((packageName, verbose) => {
    const initAction = require('./init.action');
    initAction(packageName, { verbose });
  });

module.exports = init;
