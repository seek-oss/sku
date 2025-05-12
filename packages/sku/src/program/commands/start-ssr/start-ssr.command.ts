import { Command } from 'commander';
import { statsOption } from '@/program/options/stats/stats.option.js';

const startSsrCommand = new Command('start-ssr');

startSsrCommand
  .description(
    'Start the sku development server for a server-rendered application.',
  )
  .addOption(statsOption)
  .action(async (options) => {
    const { startSsrAction } = await import('./start-ssr.action.js');
    await startSsrAction(options);
  });

export { startSsrCommand };
