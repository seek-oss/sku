import { Command } from 'commander';

const testCommand = new Command('test');

testCommand
  .description('Run unit tests.')
  .allowUnknownOption()
  .allowExcessArguments()
  .action(async (_, { args }) => {
    const { testAction } = await import('./test.action.js');
    testAction({ args });
  });

export { testCommand };
