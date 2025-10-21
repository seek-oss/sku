import { Command } from 'commander';
import { statsOption } from '../../options/stats.option.js';
import { listUrlsOption } from '../../options/list-urls.js';

export const startSsrCommand = new Command('start-ssr')
  .description(
    'Start the sku development server for a server-rendered application.',
  )
  .addOption(statsOption)
  .addOption(listUrlsOption)
  .action(async (options) => {
    const { startSsrAction } = await import('./start-ssr.action.js');
    await startSsrAction(options);
  });
