import { Command } from 'commander';

const test = new Command('test');

test
  .description('Run unit tests.')
  .allowUnknownOption(true)
  .action(async ({ args }) => {
    const { testAction } = await import('./test.action.mjs');
    testAction({ args });
  });

module.exports = test;
