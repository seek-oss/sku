import { Command } from 'commander';
import { startSsrAction } from './start-ssr.action.js';
import { statsOption } from '@/program/options/stats/stats.option.js';
import { experimentalBundlerOption } from '@/program/options/expirementalBundler/experimentalBundler.option.js';

const startSsrCommand = new Command('start-ssr');

startSsrCommand
  .description(
    'Start the sku development server for a server-rendered application.',
  )
  .addOption(experimentalBundlerOption)
  .addOption(statsOption)
  .action(startSsrAction);

export { startSsrCommand };
