import { Command } from 'commander';

const testCommand = new Command('test');

testCommand
  .description('Run unit tests.')
  .allowUnknownOption(true)
  .action(async ({ args }) => {
    const { testAction } = await import('./test.action.mjs');
    testAction({ args });
  });

export { testCommand };
