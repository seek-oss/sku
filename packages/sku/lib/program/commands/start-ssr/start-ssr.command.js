const { Command } = require('commander');
const statsOption = require('../../options/stats/stats.option');

const startSsr = new Command('start-ssr');

startSsr
  .description(
    'Start the sku development server for a server-rendered application.',
  )
  .addOption(statsOption)
  .action(({ stats }) => {
    const startSsrAction = require('./start-ssr.action');
    startSsrAction({ stats });
  });

module.exports = startSsr;
