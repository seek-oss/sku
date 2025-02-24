import { Command } from 'commander';
import { statsOption } from '../../options/stats/stats.option.js';
import { buildAction } from './build.action.js';

const buildCommand = new Command('build');

buildCommand
  .description(
    'Create a production build of a statically-rendered application.',
  )
  .addOption(statsOption)
  .action(buildAction);

export { buildCommand };
