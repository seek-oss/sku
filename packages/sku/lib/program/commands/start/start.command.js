const { Command } = require('commander');
const statsOption = require("../../options/stats/stats.option");

const start = new Command('start');

start
  .description(
    'Start the sku development server for a statically-rendered application.',
  )
  .addOption(statsOption)
  .action(({ stats }) => {
    const startAction = require('./start.action');
    startAction({ stats });
  });

module.exports = start;
