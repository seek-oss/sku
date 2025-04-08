import { Command } from 'commander';
import { startAction } from './start.action.js';
import { statsOption } from '@/program/options/stats/stats.option.js';
import {
  portOption,
  strictPortOption,
} from '../../options/port/port.option.js';

const startCommand = new Command('start');

startCommand
  .description(
    'Start the sku development server for a statically-rendered application.',
  )
  .addOption(statsOption)
  .addOption(portOption)
  .addOption(strictPortOption)
  .action(startAction);

export { startCommand };
