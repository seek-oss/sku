const { Command } = require('commander');

const format = new Command('format');

format
  .description('Apply all available lint and formatting fixes.')
  .argument('[paths...]', 'paths to format')
  .action((paths) => {
    const formatAction = require('./format.action');
    formatAction(paths);
  });

module.exports = format;
