import { Command } from 'commander';
import { statsOption } from '../../options/stats/stats.option.js';
import { startSsrAction } from './start-ssr.action.js';

const startSsrCommand = new Command('start-ssr');

startSsrCommand
  .description(
    'Start the sku development server for a server-rendered application.',
  )
  .addOption(statsOption)
  .action(startSsrAction);

export { startSsrCommand };
