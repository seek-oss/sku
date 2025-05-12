import { Command } from 'commander';
import { statsOption } from '@/program/options/stats/stats.option.js';

export const startSsrCommand = new Command('start-ssr')
  .description(
    'Start the sku development server for a server-rendered application.',
  )
  .addOption(statsOption)
  .action(async (options) => {
    const { startSsrAction } = await import('./start-ssr.action.js');
    await startSsrAction(options);
  });
