import { Command } from 'commander';

const pullCommand = new Command('pull');

pullCommand
  .description('Pull translations from Phrase')
  .action(async (options) => {
    const { pullAction } = await import('./pull.action.js');
    await pullAction(options);
  });

export { pullCommand };
