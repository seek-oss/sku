import { Command } from 'commander';

export const testCommand = new Command('test')
  .description('Run unit tests.')
  .allowUnknownOption(true)
  .allowExcessArguments(true)
  .action(async (options, argsObject) => {
    const { testAction } = await import('./test.action.js');
    await testAction(options, argsObject);
  });
