import { Command } from 'commander';

export const preCommitCommand = new Command('pre-commit');

preCommitCommand
  .description('Run the sku pre-commit hook.')
  .action(async (options) => {
    const { preCommitAction } = await import('./pre-commit.action.js');
    await preCommitAction(options);
  });
