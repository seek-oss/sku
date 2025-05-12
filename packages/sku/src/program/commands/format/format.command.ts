import { Command } from 'commander';

export const formatCommand = new Command('format')
  .description('Apply all available lint and formatting fixes.')
  .argument('[paths...]', 'paths to format')
  .action(async (paths, options) => {
    const { formatAction } = await import('./format.action.js');
    await formatAction(paths, options);
  });
