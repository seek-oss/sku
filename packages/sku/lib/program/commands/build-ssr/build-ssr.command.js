const { Command } = require('commander');
const statsOption = require('../../options/stats/stats.option');

const buildSsr = new Command('build-ssr');

buildSsr
  .description(
    'Create a production build of a server-side rendered application.',
  )
  .addOption(statsOption)
  .action(({ stats }) => {
    const buildSsrAction = require('./build-ssr.action');
    buildSsrAction({ stats });
  });

module.exports = buildSsr;
