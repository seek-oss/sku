const { Command } = require('commander');
const watchOption = require('../../../../options/watch/watch.option');

const compile = new Command('compile');

compile
  .description('Compile translations defined in .vocab directories.')
  .addOption(watchOption)
  .action(({ watch }) => {
    const compileAction = require('./compile.action');
    compileAction({ watch });
  });

module.exports = compile;
