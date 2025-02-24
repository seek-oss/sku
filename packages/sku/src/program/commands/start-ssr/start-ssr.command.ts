import { Command } from 'commander';
import { startSsrAction } from './start-ssr.action.js';
import { statsOption } from '@/program/options/stats/stats.option.js';

const startSsrCommand = new Command('start-ssr');

startSsrCommand
  .description(
    'Start the sku development server for a server-rendered application.',
  )
  .addOption(statsOption)
  .action(startSsrAction);

export { startSsrCommand };
