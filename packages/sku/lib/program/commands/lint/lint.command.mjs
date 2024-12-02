import { Command } from 'commander';

export const lintCommand = new Command('lint');

lintCommand
  .description('Run lint tooling over your code.')
  .argument('[paths...]', 'paths to lint')
  .action(async (paths) => {
    const { lintAction } = await import('./lint.action.mjs');
    lintAction(paths);
  });
