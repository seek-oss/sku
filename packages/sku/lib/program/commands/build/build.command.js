const { Command } = require('commander');
const statsOption = require('../../options/stats/stats.option');

const build = new Command('build');

build
  .description(
    'Create a production build of a statically-rendered application.',
  )
  .addOption(statsOption)
  .action(({ stats }) => {
    const buildAction = require('./build.action');
    buildAction({ stats });
  });

module.exports = build;
