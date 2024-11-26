const { Command } = require('commander');

const start = new Command('start');

start
  .description(
    'Start the sku development server for a statically-rendered application.',
  )
  .action(() => {
    const startAction = require('./start.action');
    startAction();
  });

module.exports = start;
