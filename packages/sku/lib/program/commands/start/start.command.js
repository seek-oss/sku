const { Command } = require('commander');
const statsOption = require('../../options/stats/stats.option');

const start = new Command('start');

start
  .description(
    'Start the sku development server for a statically-rendered application.',
  )
  .addOption(statsOption)
  .action(({ stats }, command) => {
    const environment = command.parent.opts()?.environment;

    const startAction = require('./start.action');
    startAction({ stats, environment });
  });

module.exports = start;
