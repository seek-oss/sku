import { Command } from 'commander';

export const lintCommand = new Command('lint')
  .description('Run lint tooling over your code.')
  .argument('[paths...]', 'paths to lint')
  .action(async (paths, options) => {
    const { lintAction } = await import('./lint.action.js');
    await lintAction(paths, options);
  });
