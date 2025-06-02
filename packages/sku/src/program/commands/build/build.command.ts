import { Command } from 'commander';
import { statsOption } from '../../options/stats/stats.option.js';
import { convertLoadableOption } from '@/program/options/convertLoadable/convertLoadable.option.js';

export const buildCommand = new Command('build')
  .description(
    'Create a production build of a statically-rendered application.',
  )
  .addOption(statsOption)
  .addOption(convertLoadableOption)
  .action(async (options) => {
    const { buildAction } = await import('./build.action.js');
    await buildAction(options);
  });
