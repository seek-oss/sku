import { Command } from 'commander';
import { statsOption } from '@/program/options/stats/stats.option.js';
import {
  portOption,
  strictPortOption,
} from '../../options/port/port.option.js';
import { convertLoadableOption } from '@/program/options/convertLoadable/convertLoadable.option.js';

export const startCommand = new Command('start')
  .description(
    'Start the sku development server for a statically-rendered application.',
  )
  .addOption(statsOption)
  .addOption(portOption)
  .addOption(strictPortOption)
  .addOption(convertLoadableOption)
  .action(async (options, command) => {
    const { startAction } = await import('./start.action.js');
    await startAction(options, command);
  });
