import { Command } from 'commander';
import { statsOption } from '../../options/stats/stats.option.js';
import { buildAction } from './build.action.js';
import { convertLoadableOption } from '@/program/options/convertLoadable/convertLoadable.option.js';

const buildCommand = new Command('build');

buildCommand
  .description(
    'Create a production build of a statically-rendered application.',
  )
  .addOption(statsOption)
  .addOption(convertLoadableOption)
  .action(buildAction);

export { buildCommand };
