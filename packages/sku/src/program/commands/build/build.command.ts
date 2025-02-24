import { Command } from 'commander';
import { statsOption } from '../../options/stats/stats.option.js';
import { buildAction } from './build.action.js';
import { experimentalBundlerOption } from '@/program/options/expirementalBundler/experimentalBundler.option.js';

const buildCommand = new Command('build');

buildCommand
  .description(
    'Create a production build of a statically-rendered application.',
  )
  .addOption(statsOption)
  .addOption(experimentalBundlerOption)
  .action(buildAction);

export { buildCommand };
