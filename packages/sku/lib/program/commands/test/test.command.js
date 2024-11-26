const { Command } = require('commander');
const watchOption = require('../../options/watch/watch.option');

const test = new Command('test');

test
  .description('Run unit tests.')
  .addOption(watchOption)
  .allowUnknownOption(true)
  .action(({ watch }, { args }) => {
    const testAction = require('./test.action');
    testAction({ watch, args });
  });

module.exports = test;
