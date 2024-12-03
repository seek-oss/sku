import { Command } from 'commander';

const pullCommand = new Command('pull');

pullCommand.description('Pull translations from Phrase').action(async () => {
  const { pullAction } = await import('./pull.action');
  pullAction();
});

export { pullCommand };
