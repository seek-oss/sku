const { Command } = require('commander');

const test = new Command('test');

test
  .description('Run unit tests.')
  .allowUnknownOption(true)
  .action(({ args }) => {
    const testAction = require('./test.action');
    testAction({ args });
  });

module.exports = test;
