import { Command } from 'commander';

export const pullCommand = new Command('pull')
  .description('Pull translations from Phrase')
  .action(async (options) => {
    const { pullAction } = await import('./pull.action.js');
    await pullAction(options);
  });
