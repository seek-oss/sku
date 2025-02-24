import { Command } from 'commander';
import { startAction } from './start.action.js';
import { experimentalBundlerOption } from '@/program/options/expirementalBundler/experimentalBundler.option.js';
import { statsOption } from '@/program/options/stats/stats.option.js';

const startCommand = new Command('start');

startCommand
  .description(
    'Start the sku development server for a statically-rendered application.',
  )
  .addOption(experimentalBundlerOption)
  .addOption(statsOption)
  .action(startAction);

export { startCommand };
