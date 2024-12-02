const { Command } = require('commander');
const statsOption = require('../../options/stats/stats.option');

const buildCommand = new Command('build');

buildCommand
  .description(
    'Create a production build of a statically-rendered application.',
  )
  .addOption(statsOption)
  .action(async ({ stats }) => {
    const { buildAction } = await import('./build.action');
    buildAction({ stats });
  });

export { buildCommand };
