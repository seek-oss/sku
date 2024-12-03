import { Command } from 'commander';

export const formatCommand = new Command('format');

formatCommand
  .description('Apply all available lint and formatting fixes.')
  .argument('[paths...]', 'paths to format')
  .action(async (paths) => {
    const { formatAction } = await import('./format.action.js');
    formatAction(paths);
  });
