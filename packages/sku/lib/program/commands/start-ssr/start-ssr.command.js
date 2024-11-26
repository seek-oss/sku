const { Command } = require('commander');

const startSsr = new Command('start-ssr');

startSsr
  .description(
    'Start the sku development server for a server-rendered application.',
  )
  .action(() => {
    const startSsrAction = require('./start-ssr.action');
    startSsrAction();
  });

module.exports = startSsr;
