import { Command } from 'commander';
import { statsOption } from '../../options/stats/stats.option.js';

const buildCommand = new Command('build');

buildCommand
  .description(
    'Create a production build of a statically-rendered application.',
  )
  .addOption(statsOption)
  .action(async ({ stats }) => {
    const { buildAction } = await import('./build.action.js');
    buildAction({ stats });
  });

export { buildCommand };
